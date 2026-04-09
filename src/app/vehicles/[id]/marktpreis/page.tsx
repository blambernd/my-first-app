import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getEffectivePlan, hasPremiumAccess } from "@/lib/subscription";
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
    .select("plan, status, trial_end")
    .eq("user_id", user.id)
    .single();

  const effectivePlan = subscription ? getEffectivePlan(subscription) : "free";

  if (!hasPremiumAccess(effectivePlan)) {
    return (
      <PremiumUpsell
        feature="Marktpreis-Analyse"
        description="Erfahre den aktuellen Marktwert deines Oldtimers basierend auf vergleichbaren Inseraten."
      />
    );
  }

  redirect(`/vehicles/${id}/verkaufsassistent?schritt=1`);
}
