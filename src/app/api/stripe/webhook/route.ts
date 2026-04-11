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
          try {
            const subResponse = await getStripe().subscriptions.retrieve(subscriptionId);
            const sub = subResponse as unknown as Record<string, unknown>;
            const startTs = sub.current_period_start as number | undefined;
            const endTs = sub.current_period_end as number | undefined;
            if (startTs) periodStart = new Date(startTs * 1000).toISOString();
            if (endTs) periodEnd = new Date(endTs * 1000).toISOString();
          } catch (subErr) {
            console.error("Failed to fetch subscription details:", subErr);
          }
        }

        await adminClient
          .from("subscriptions")
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId || null,
            plan: "premium",
            status: "active",
            current_period_start: periodStart,
            current_period_end: periodEnd,
            trial_end: null,
            cancel_at_period_end: false,
            past_due_since: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

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
        const updStartTs = subData.current_period_start as number | undefined;
        const updEndTs = subData.current_period_end as number | undefined;

        // Check if user just canceled within 14-day withdrawal period
        if (subscription.cancel_at_period_end) {
          const createdTs = subData.created as number | undefined;
          const subCreated = createdTs ? new Date(createdTs * 1000) : null;
          const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
          const isWithinWithdrawal = subCreated ? (Date.now() - subCreated.getTime() <= fourteenDaysMs) : false;

          if (isWithinWithdrawal) {
            // Auto-refund and cancel immediately per German withdrawal law (§ 355 BGB)
            try {
              const invoices = await getStripe().invoices.list({
                subscription: subscription.id,
                limit: 1,
              });
              const latestInvoice = invoices.data[0] as unknown as Record<string, unknown>;
              const piRaw = latestInvoice?.payment_intent;
              if (piRaw) {
                const paymentIntentId =
                  typeof piRaw === "string"
                    ? piRaw
                    : (piRaw as { id: string }).id;
                await getStripe().refunds.create({
                  payment_intent: paymentIntentId,
                  reason: "requested_by_customer",
                });
                console.log(`Widerruf: Refund issued for user ${userId}`);
              }
              // Cancel immediately instead of at period end
              await getStripe().subscriptions.cancel(subscription.id);
              console.log(`Widerruf: Subscription ${subscription.id} canceled immediately`);
              // The cancel will trigger customer.subscription.deleted which handles the DB update
              break;
            } catch (refundErr) {
              console.error("Widerruf refund failed:", refundErr);
            }
          }
        }

        await adminClient
          .from("subscriptions")
          .update({
            plan,
            status,
            current_period_start: updStartTs ? new Date(updStartTs * 1000).toISOString() : null,
            current_period_end: updEndTs ? new Date(updEndTs * 1000).toISOString() : null,
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

        // Check if within 14-day withdrawal period (Widerrufsrecht)
        const createdTs = (subscription as unknown as Record<string, unknown>).created as number | undefined;
        const subCreated = createdTs ? new Date(createdTs * 1000) : null;
        const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
        const isWithinWithdrawal = subCreated ? (Date.now() - subCreated.getTime() <= fourteenDaysMs) : false;

        if (isWithinWithdrawal) {
          // Auto-refund the latest invoice per German withdrawal law (§ 355 BGB)
          try {
            const invoices = await getStripe().invoices.list({
              subscription: subscription.id,
              limit: 1,
            });
            const latestInvoice = invoices.data[0] as unknown as Record<string, unknown>;
            const piRaw = latestInvoice?.payment_intent;
            if (piRaw) {
              const paymentIntentId =
                typeof piRaw === "string"
                  ? piRaw
                  : (piRaw as { id: string }).id;
              await getStripe().refunds.create({
                payment_intent: paymentIntentId,
                reason: "requested_by_customer",
              });
              console.log(`Widerruf: Refund issued for user ${userId}, invoice ${latestInvoice.id}`);
            }
          } catch (refundErr) {
            console.error("Widerruf refund failed:", refundErr);
          }
        }

        // Check if user has referral bonus months — recalculate bonus_until
        // so bonus months are not "consumed" during the paid subscription period
        const { data: subBeforeCancel } = await adminClient
          .from("subscriptions")
          .select("referral_bonus_months")
          .eq("user_id", userId)
          .single();

        const bonusMonths = subBeforeCancel?.referral_bonus_months ?? 0;
        let newBonusUntil: string | null = null;
        if (bonusMonths > 0) {
          const bonusEnd = new Date();
          bonusEnd.setMonth(bonusEnd.getMonth() + bonusMonths);
          newBonusUntil = bonusEnd.toISOString();
          console.log(`Referral: Restoring ${bonusMonths} bonus months for user ${userId}, until ${newBonusUntil}`);
        }

        await adminClient
          .from("subscriptions")
          .update({
            plan: "free",
            status: "canceled",
            stripe_subscription_id: null,
            cancel_at_period_end: false,
            ...(newBonusUntil ? { referral_bonus_until: newBonusUntil } : {}),
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
            past_due_since: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        break;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Webhook processing error:", message, err);
    return NextResponse.json(
      { error: `Webhook processing failed: ${message}` },
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
