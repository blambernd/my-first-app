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
    console.log(`Referral: User ${user.id} has ${count} vehicles, skipping (need exactly 1)`);
    return NextResponse.json({ completed: false, reason: "not_first_vehicle", count });
  }

  // Ensure referral entry exists (DB trigger may not have created it)
  // Check user metadata for referral_code and create entry if missing
  const { data: existingReferral } = await adminClient
    .from("referrals")
    .select("id")
    .eq("referred_id", user.id)
    .single();

  if (!existingReferral) {
    // No referral entry — try to create from user metadata
    const referralCode = user.user_metadata?.referral_code as string | undefined;
    console.log(`Referral: No entry for user ${user.id}, metadata referral_code=${referralCode || "none"}`);

    if (referralCode) {
      // Find the referrer by their referral code
      const { data: referrerSub } = await adminClient
        .from("subscriptions")
        .select("user_id")
        .eq("referral_code", referralCode)
        .single();

      if (referrerSub && referrerSub.user_id !== user.id) {
        const { error: insertError } = await adminClient
          .from("referrals")
          .insert({
            referrer_id: referrerSub.user_id,
            referred_id: user.id,
            referral_code: referralCode,
            status: "pending",
          });
        if (insertError) {
          console.error(`Referral: Failed to create entry:`, insertError.message);
        } else {
          console.log(`Referral: Created entry for referrer ${referrerSub.user_id} → referred ${user.id}`);
        }
      } else {
        console.log(`Referral: No matching referrer for code ${referralCode}`);
        return NextResponse.json({ completed: false, reason: "no_matching_referrer" });
      }
    } else {
      console.log(`Referral: User ${user.id} has no referral_code in metadata`);
      return NextResponse.json({ completed: false, reason: "no_referral_code" });
    }
  }

  // Atomically mark referral as completed (prevents race condition)
  // Only updates if status is still 'pending', returns nothing if already completed
  const { data: referral, error: referralError } = await adminClient
    .from("referrals")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("referred_id", user.id)
    .eq("status", "pending")
    .select()
    .single();

  if (!referral) {
    console.log(`Referral: No pending referral for user ${user.id}`, referralError?.message);
    return NextResponse.json({ completed: false, reason: "no_pending_referral" });
  }

  console.log(`Referral: Completing referral ${referral.id}, referrer=${referral.referrer_id}`);

  // Grant bonus to referrer: +3 months
  const { data: referrerSub } = await adminClient
    .from("subscriptions")
    .select("referral_bonus_months, referral_bonus_until, plan, status, current_period_end")
    .eq("user_id", referral.referrer_id)
    .single();

  if (referrerSub) {
    console.log(`Referral: Granting ${REFERRER_BONUS_MONTHS} months to referrer ${referral.referrer_id}`);
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
    console.log(`Referral: Referrer bonus set to ${newBonusMonths} months, until ${bonusUntil.toISOString()}`);
  } else {
    console.warn(`Referral: No subscription found for referrer ${referral.referrer_id}`);
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
    console.log(`Referral: Referred user bonus set to ${newReferredBonusMonths} months, until ${bonusUntil.toISOString()}`);
  } else {
    console.warn(`Referral: No subscription found for referred user ${user.id}`);
  }

  console.log(`Referral: Successfully completed referral ${referral.id}`);
  return NextResponse.json({ completed: true });
}
