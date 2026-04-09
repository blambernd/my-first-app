import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const REFERRER_BONUS_MONTHS = 3;
const REFERRED_BONUS_MONTHS = 1;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "Server-Konfigurationsfehler" }, { status: 500 });
  }

  const adminClient = createServiceClient(url, serviceKey);

  // Check if this is actually the user's first vehicle
  const { count } = await adminClient
    .from("vehicles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Only trigger on first vehicle (count should be 1 after the insert)
  if ((count ?? 0) !== 1) {
    return NextResponse.json({ completed: false });
  }

  // Atomically mark referral as completed (prevents race condition)
  // Only updates if status is still 'pending', returns nothing if already completed
  const { data: referral } = await adminClient
    .from("referrals")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("referred_id", user.id)
    .eq("status", "pending")
    .select()
    .single();

  if (!referral) {
    // No pending referral or already completed
    return NextResponse.json({ completed: false });
  }

  // Grant bonus to referrer: +3 months
  const { data: referrerSub } = await adminClient
    .from("subscriptions")
    .select("referral_bonus_months, referral_bonus_until, plan, status, current_period_end")
    .eq("user_id", referral.referrer_id)
    .single();

  if (referrerSub) {
    const newBonusMonths = (referrerSub.referral_bonus_months ?? 0) + REFERRER_BONUS_MONTHS;

    // Calculate new bonus_until date
    let bonusStart: Date;
    if (referrerSub.referral_bonus_until && new Date(referrerSub.referral_bonus_until) > new Date()) {
      // Extend existing bonus
      bonusStart = new Date(referrerSub.referral_bonus_until);
    } else if (referrerSub.plan === "premium" && referrerSub.status === "active" && referrerSub.current_period_end) {
      // Has active Stripe subscription — bonus starts after it ends
      bonusStart = new Date(referrerSub.current_period_end);
    } else {
      // Free user — bonus starts now
      bonusStart = new Date();
    }

    const bonusUntil = new Date(bonusStart);
    bonusUntil.setMonth(bonusUntil.getMonth() + REFERRER_BONUS_MONTHS);

    await adminClient
      .from("subscriptions")
      .update({
        referral_bonus_months: newBonusMonths,
        referral_bonus_until: bonusUntil.toISOString(),
      })
      .eq("user_id", referral.referrer_id);
  }

  // Grant bonus to referred user: +1 month
  const { data: referredSub } = await adminClient
    .from("subscriptions")
    .select("referral_bonus_months, referral_bonus_until")
    .eq("user_id", user.id)
    .single();

  if (referredSub) {
    const newReferredBonusMonths = (referredSub.referral_bonus_months ?? 0) + REFERRED_BONUS_MONTHS;
    const bonusStart = referredSub.referral_bonus_until && new Date(referredSub.referral_bonus_until) > new Date()
      ? new Date(referredSub.referral_bonus_until)
      : new Date();
    const bonusUntil = new Date(bonusStart);
    bonusUntil.setMonth(bonusUntil.getMonth() + REFERRED_BONUS_MONTHS);

    await adminClient
      .from("subscriptions")
      .update({
        referral_bonus_months: newReferredBonusMonths,
        referral_bonus_until: bonusUntil.toISOString(),
      })
      .eq("user_id", user.id);
  }

  return NextResponse.json({ completed: true });
}
