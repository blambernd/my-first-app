import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return _stripe;
}

export const PLANS = {
  free: {
    name: "Free",
    maxVehicles: 1,
    maxStorageMb: 100,
  },
  premium: {
    name: "Premium",
    maxVehicles: Infinity,
    maxStorageMb: 5120, // 5 GB
  },
  trial: {
    name: "Trial",
    maxVehicles: Infinity,
    maxStorageMb: 5120,
  },
} as const;

export type PlanType = keyof typeof PLANS;
