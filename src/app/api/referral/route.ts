import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  // Get referral code from subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("referral_code, referral_bonus_months")
    .eq("user_id", user.id)
    .single();

  if (!subscription?.referral_code) {
    return NextResponse.json({ error: "Kein Referral-Code" }, { status: 404 });
  }

  // Get referral statistics
  const { data: referrals } = await supabase
    .from("referrals")
    .select("status")
    .eq("referrer_id", user.id);

  const completedCount = (referrals ?? []).filter(
    (r) => r.status === "completed"
  ).length;
  const pendingCount = (referrals ?? []).filter(
    (r) => r.status === "pending"
  ).length;

  return NextResponse.json({
    referralCode: subscription.referral_code,
    completedCount,
    pendingCount,
    bonusMonths: subscription.referral_bonus_months ?? 0,
  });
}
