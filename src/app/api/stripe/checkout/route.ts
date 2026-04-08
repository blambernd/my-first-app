import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  interval: z.enum(["month", "year"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  // Validate input
  let body: z.infer<typeof checkoutSchema>;
  try {
    body = checkoutSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Ungültige Anfrage. Bitte wähle Monat oder Jahr." },
      { status: 400 }
    );
  }

  const priceId =
    body.interval === "month"
      ? process.env.STRIPE_PRICE_MONTHLY
      : process.env.STRIPE_PRICE_YEARLY;

  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe-Preise nicht konfiguriert." },
      { status: 503 }
    );
  }

  // Check if user already has a subscription record
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id, plan, status")
    .eq("user_id", user.id)
    .single();

  if (subscription?.plan === "premium" && subscription?.status === "active") {
    return NextResponse.json(
      { error: "Du hast bereits ein Premium-Abo." },
      { status: 400 }
    );
  }

  // Reuse existing Stripe customer or create new one
  let customerId = subscription?.stripe_customer_id;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgrade=success`,
    cancel_url: `${appUrl}/dashboard?upgrade=canceled`,
    subscription_data: {
      trial_period_days:
        subscription?.plan === "trial" ? undefined : undefined, // Trial is handled at account creation
      metadata: { supabase_user_id: user.id },
    },
    metadata: { supabase_user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}
