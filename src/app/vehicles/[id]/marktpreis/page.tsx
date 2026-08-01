import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getEffectivePlan, hasPremiumAccess, isBetaMode } from "@/lib/subscription";
import { PremiumUpsell } from "@/components/premium-upsell";

interface MarktpreisPageProps {
  params: Promise<{ id: string }>;
}

export default async function MarktpreisPage({ params }: MarktpreisPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, trial_end, referral_bonus_until")
    .eq("user_id", user.id)
    .single();

  const effectivePlan = subscription ? getEffectivePlan(subscription) : isBetaMode ? "premium" : "free";

  if (!hasPremiumAccess(effectivePlan)) {
    return (
      <PremiumUpsell
        feature="Marktüberblick"
        description="Sieh, in welchem Bereich vergleichbare Oldtimer aktuell angeboten werden."
      />
    );
  }

  redirect(`/vehicles/${id}/verkaufsassistent?schritt=1`);
}
