import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasPriceMonthly: !!process.env.STRIPE_PRICE_MONTHLY,
    hasPriceYearly: !!process.env.STRIPE_PRICE_YEARLY,
  });
}
