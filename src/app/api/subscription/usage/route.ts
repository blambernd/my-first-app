import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getEffectivePlan, calculateStorageUsageMb, isBetaMode } from "@/lib/subscription";
import { PLANS } from "@/lib/stripe";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  // Get subscription for plan limits
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, trial_end")
    .eq("user_id", user.id)
    .single();

  const effectivePlan = subscription
    ? getEffectivePlan(subscription)
    : isBetaMode ? "premium" : "free";

  const planLimits = PLANS[effectivePlan];

  // Get vehicle count
  const { count: vehicleCount } = await supabase
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Calculate storage usage
  const storageMb = await calculateStorageUsageMb(user.id);

  return NextResponse.json({
    vehicleCount: vehicleCount ?? 0,
    maxVehicles: planLimits.maxVehicles,
    storageMb: Math.round(storageMb * 100) / 100,
    maxStorageMb: planLimits.maxStorageMb,
    plan: effectivePlan,
  });
}
