import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

// Disable body parsing — Stripe needs the raw body for signature verification
export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Server configuration missing" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const adminClient = createServiceClient(url, serviceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (!userId || !customerId) break;

        // Fetch the actual subscription to get period details
        let periodStart: string | null = null;
        let periodEnd: string | null = null;
        if (subscriptionId) {
          const subResponse = await getStripe().subscriptions.retrieve(subscriptionId);
          // Stripe v22+ wraps in Response — access data via lastResponse or cast
          const sub = subResponse as unknown as Record<string, unknown>;
          periodStart = new Date(
            (sub.current_period_start as number) * 1000
          ).toISOString();
          periodEnd = new Date((sub.current_period_end as number) * 1000).toISOString();
        }

        await adminClient
          .from("subscriptions")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId || null,
            plan: "premium",
            status: "active",
            current_period_start: periodStart,
            current_period_end: periodEnd,
            trial_end: null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        // Unlock all vehicles for this user
        await adminClient
          .from("vehicles")
          .update({ is_locked: false })
          .eq("user_id", userId);

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) break;

        const plan =
          subscription.status === "active" ? "premium" : "free";
        const status = mapStripeStatus(subscription.status);

        const subData = subscription as unknown as Record<string, unknown>;
        await adminClient
          .from("subscriptions")
          .update({
            plan,
            status,
            current_period_start: new Date(
              (subData.current_period_start as number) * 1000
            ).toISOString(),
            current_period_end: new Date(
              (subData.current_period_end as number) * 1000
            ).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        // If downgraded, lock excess vehicles
        if (plan === "free") {
          await lockExcessVehicles(adminClient, userId);
        } else {
          // Unlock all vehicles
          await adminClient
            .from("vehicles")
            .update({ is_locked: false })
            .eq("user_id", userId);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) break;

        await adminClient
          .from("subscriptions")
          .update({
            plan: "free",
            status: "canceled",
            stripe_subscription_id: null,
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        await lockExcessVehicles(adminClient, userId);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) break;

        await adminClient
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        break;
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status
): string {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    case "trialing":
      return "trialing";
    default:
      return "active";
  }
}

/**
 * Lock all vehicles except the most recently updated one.
 */
async function lockExcessVehicles(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: ReturnType<typeof createServiceClient<any, any, any>>,
  userId: string
) {
  // First unlock all, then lock all except the most recently updated
  const { data: vehicles } = await adminClient
    .from("vehicles")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (!vehicles || vehicles.length <= 1) {
    // 0 or 1 vehicle — nothing to lock
    if (vehicles?.length === 1) {
      await adminClient
        .from("vehicles")
        .update({ is_locked: false })
        .eq("id", vehicles[0].id);
    }
    return;
  }

  // Keep the first one (most recent) unlocked, lock the rest
  const [active, ...toLock] = vehicles;

  await adminClient
    .from("vehicles")
    .update({ is_locked: false })
    .eq("id", active.id);

  await adminClient
    .from("vehicles")
    .update({ is_locked: true })
    .in(
      "id",
      toLock.map((v) => v.id)
    );
}
