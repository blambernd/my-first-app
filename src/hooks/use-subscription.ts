"use client";

import { useState, useEffect } from "react";

export interface SubscriptionData {
  plan: "free" | "premium" | "trial";
  status: string;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  limits: {
    name: string;
    maxVehicles: number;
    maxStorageMb: number;
  };
  vehicleCount: number;
  storageMb: number;
  referralBonusMonths: number;
  referralBonusUntil: string | null;
}

function calcTrialDays(data: SubscriptionData | null): number | null {
  if (!data || data.plan !== "trial" || !data.trialEnd) return null;
  return Math.max(0, Math.ceil((new Date(data.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function useSubscription() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/subscription")
      .then((res) => res.json())
      .then((json: SubscriptionData) => {
        setData(json);
        setTrialDaysLeft(calcTrialDays(json));
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const isPremium = data?.plan === "premium" || data?.plan === "trial";
  const isTrial = data?.plan === "trial";

  return { data, loading, isPremium, isTrial, trialDaysLeft };
}
