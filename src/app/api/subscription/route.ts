import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getEffectivePlan, calculateStorageUsageMb } from "@/lib/subscription";
import { PLANS } from "@/lib/stripe";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  // Get subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!subscription) {
    // No subscription row — treat as free
    return NextResponse.json({
      plan: "free",
      status: "active",
      trialEnd: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      stripeCustomerId: null,
      limits: PLANS.free,
    });
  }

  const effectivePlan = getEffectivePlan(subscription);

  // Get vehicle count and storage usage in parallel
  const [vehicleResult, storageMb] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    calculateStorageUsageMb(user.id),
  ]);

  return NextResponse.json({
    plan: effectivePlan,
    status: subscription.status,
    trialEnd: subscription.trial_end,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: subscription.current_period_end,
    stripeCustomerId: subscription.stripe_customer_id,
    limits: PLANS[effectivePlan],
    vehicleCount: vehicleResult.count ?? 0,
    storageMb: Math.round(storageMb * 100) / 100,
  });
}
