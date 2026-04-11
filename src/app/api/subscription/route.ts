import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getEffectivePlan, calculateStorageUsageMb, isBetaMode } from "@/lib/subscription";
import { PLANS } from "@/lib/stripe";

/** Serialize plan limits so Infinity becomes -1 (JSON-safe) */
function serializeLimits(plan: keyof typeof PLANS) {
  const p = PLANS[plan];
  return {
    name: p.name,
    maxVehicles: p.maxVehicles === Infinity ? -1 : p.maxVehicles,
    maxStorageMb: p.maxStorageMb === Infinity ? -1 : p.maxStorageMb,
  };
}

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

  const effectivePlan = subscription
    ? getEffectivePlan(subscription)
    : isBetaMode ? "premium" : "free";

  if (!subscription) {
    return NextResponse.json({
      plan: effectivePlan,
      status: "active",
      trialEnd: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      stripeCustomerId: null,
      limits: serializeLimits(effectivePlan),
      vehicleCount: 0,
      storageMb: 0,
    });
  }

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
    limits: serializeLimits(effectivePlan),
    vehicleCount: vehicleResult.count ?? 0,
    storageMb: Math.round(storageMb * 100) / 100,
  });
}
