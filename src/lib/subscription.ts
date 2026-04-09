import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { PlanType } from "./stripe";
import { PLANS } from "./stripe";

export interface SubscriptionInfo {
  plan: PlanType;
  status: string;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
}

export interface UsageInfo {
  vehicleCount: number;
  maxVehicles: number;
  storageMb: number;
  maxStorageMb: number;
}

/**
 * Get the effective plan for a user. Handles trial expiration.
 */
const GRACE_PERIOD_DAYS = 7;

export const isBetaMode = process.env.NEXT_PUBLIC_BETA_MODE === "true";

export function getEffectivePlan(subscription: {
  plan: string;
  status: string;
  trial_end: string | null;
  past_due_since?: string | null;
  referral_bonus_until?: string | null;
}): PlanType {
  if (isBetaMode) return "premium";
  if (subscription.plan === "trial") {
    if (
      subscription.trial_end &&
      new Date(subscription.trial_end) < new Date()
    ) {
      // Trial expired — check referral bonus
      if (hasReferralBonus(subscription.referral_bonus_until)) {
        return "premium";
      }
      return "free";
    }
    return "trial";
  }
  if (subscription.status === "canceled") {
    // Canceled — check referral bonus
    if (hasReferralBonus(subscription.referral_bonus_until)) {
      return "premium";
    }
    return "free";
  }
  if (subscription.status === "past_due") {
    // Grace period: keep premium for 7 days after payment failure
    if (subscription.past_due_since) {
      const pastDueDate = new Date(subscription.past_due_since);
      const graceEnd = new Date(pastDueDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
      if (new Date() < graceEnd) {
        return subscription.plan as PlanType; // Still within grace period
      }
    }
    // Grace period expired — check referral bonus
    if (hasReferralBonus(subscription.referral_bonus_until)) {
      return "premium";
    }
    return "free";
  }
  return subscription.plan as PlanType;
}

/**
 * Check if a user has an active referral bonus.
 */
function hasReferralBonus(referralBonusUntil?: string | null): boolean {
  return !!referralBonusUntil && new Date(referralBonusUntil) > new Date();
}

/**
 * Check if a user can add another vehicle.
 */
export function canAddVehicle(
  plan: PlanType,
  currentCount: number
): boolean {
  return currentCount < PLANS[plan].maxVehicles;
}

/**
 * Check if a user can upload more files.
 */
export function canUpload(
  plan: PlanType,
  currentStorageMb: number,
  uploadSizeMb: number
): boolean {
  return currentStorageMb + uploadSizeMb <= PLANS[plan].maxStorageMb;
}

/**
 * Check if a feature requires premium.
 */
export function isPremiumFeature(feature: "verkaufsassistent" | "marktpreis"): boolean {
  return true; // Both are always premium
}

/**
 * Check if the user has premium access (premium plan or active trial).
 */
export function hasPremiumAccess(plan: PlanType): boolean {
  return plan === "premium" || plan === "trial";
}

/**
 * Calculate total storage usage for a user in MB.
 * Uses the service role client to access storage metadata.
 */
export async function calculateStorageUsageMb(userId: string): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return 0;

  const adminClient = createServiceClient(url, serviceKey);

  // Get all vehicle IDs for this user
  const { data: vehicles } = await adminClient
    .from("vehicles")
    .select("id")
    .eq("user_id", userId);

  if (!vehicles || vehicles.length === 0) return 0;

  const vehicleIds = vehicles.map((v) => v.id);

  // Sum file sizes across all storage tables
  const [imagesResult, milestoneImagesResult, documentsResult] =
    await Promise.all([
      adminClient
        .from("vehicle_images")
        .select("file_size")
        .in("vehicle_id", vehicleIds),
      adminClient
        .from("vehicle_milestone_images")
        .select("file_size, vehicle_milestones!inner(vehicle_id)")
        .in("vehicle_milestones.vehicle_id", vehicleIds),
      adminClient
        .from("vehicle_documents")
        .select("file_size")
        .in("vehicle_id", vehicleIds),
    ]);

  let totalBytes = 0;

  for (const img of imagesResult.data || []) {
    totalBytes += (img as { file_size?: number }).file_size || 0;
  }
  for (const img of milestoneImagesResult.data || []) {
    totalBytes += (img as { file_size?: number }).file_size || 0;
  }
  for (const doc of documentsResult.data || []) {
    totalBytes += (doc as { file_size?: number }).file_size || 0;
  }

  return Math.round((totalBytes / (1024 * 1024)) * 100) / 100;
}
