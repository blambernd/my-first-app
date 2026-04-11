import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  // Get referral code from subscription
  let { data: subscription } = await supabase
    .from("subscriptions")
    .select("referral_code, referral_bonus_months")
    .eq("user_id", user.id)
    .single();

  // Auto-create subscription if missing (DB trigger may have failed)
  if (!subscription) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && serviceKey) {
      const adminClient = createServiceClient(url, serviceKey);
      const referralCode = crypto.randomBytes(4).toString("hex");
      const { data: newSub } = await adminClient
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan: "free",
          status: "active",
          referral_code: referralCode,
        }, { onConflict: "user_id" })
        .select("referral_code, referral_bonus_months")
        .single();
      subscription = newSub;
    }
  }

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
