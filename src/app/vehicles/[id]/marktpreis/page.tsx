import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getEffectivePlan, hasPremiumAccess, isBetaMode } from "@/lib/subscription";
import { PremiumUpsell } from "@/components/premium-upsell";
import { VERKAUFSASSISTENT_AKTIV } from "@/lib/feature-flags";

interface MarktpreisPageProps {
  params: Promise<{ id: string }>;
}

export default async function MarktpreisPage({ params }: MarktpreisPageProps) {
  const { id } = await params;

  // Kurzverweis auf Schritt 1 (Marktüberblick) des Verkaufsassistenten.
  // Die Premium-Prüfung darunter entfällt bewusst: Wer die Funktion gar nicht
  // bekommt, soll auch keine Kaufaufforderung dafür sehen.
  if (!VERKAUFSASSISTENT_AKTIV) {
    redirect(`/vehicles/${id}`);
  }

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
