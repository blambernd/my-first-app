import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import {
  getEffectivePlan,
  hasPremiumAccess,
  isBetaMode,
} from "@/lib/subscription";
import { PremiumUpsell } from "@/components/premium-upsell";
import { CostAnalysisView } from "@/components/cost-analysis-view";
import {
  analyzeCosts,
  buildPeriods,
  type AnalysisInput,
  type ServiceEntryForAnalysis,
} from "@/lib/cost-analysis";
import {
  normalizeFuelEntry,
  type FuelEntry,
} from "@/lib/validations/fuel-entry";
import {
  normalizeRecurringCost,
  type RecurringCost,
} from "@/lib/validations/recurring-cost";
import {
  normalizeOneOffCost,
  type OneOffCost,
} from "@/lib/validations/one-off-cost";

interface AuswertungPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Obergrenze je Quelle. Wird sie erreicht, deckt die Auswertung nur einen Teil
 * ab — darauf weist die Oberfläche ausdrücklich hin, statt eine unvollständige
 * Summe als vollständig auszugeben.
 */
const MAX_ROWS = 2000;

export default async function AuswertungPage({ params }: AuswertungPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Besitzprüfung und Abo-Status hängen nicht voneinander ab und laufen
  // deshalb gemeinsam. Die Seitenzeit besteht fast vollständig aus
  // Netzwerkwegen zur Datenbank — jeder eingesparte Weg zählt mehr als jede
  // Optimierung der Rechnung, die bei 868 Datensätzen unter 4 ms liegt.
  const [{ data: ownedVehicle }, { data: subscription }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("plan, status, trial_end, referral_bonus_until")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // Kostenauswertung ist dem Besitzer vorbehalten (Tech Design C10).
  // Kosten sind sensibler als die Wartungshistorie: Eine eingeladene Werkstatt
  // soll nicht sehen, was der Besitzer anderswo bezahlt hat.
  if (!ownedVehicle) {
    notFound();
  }

  const effectivePlan = subscription
    ? getEffectivePlan(subscription)
    : isBetaMode
      ? "premium"
      : "free";

  if (!hasPremiumAccess(effectivePlan)) {
    return (
      <div className="space-y-6">
        <PremiumUpsell
          feature="Kostenanalyse"
          description="Alle Kosten deines Fahrzeugs an einer Stelle: Verteilung nach Kostenart, Entwicklung über die Zeit, Kosten pro Kilometer und die Antwort auf die Frage, was das Fahrzeug kostet, wenn es nur steht."
        />
      </div>
    );
  }

  // Alle vier Quellen parallel laden — sie hängen nicht voneinander ab
  const [fuelResult, serviceResult, recurringResult, oneOffResult] =
    await Promise.all([
      supabase
        .from("fuel_entries")
        .select("*", { count: "exact" })
        .eq("vehicle_id", id)
        .order("fueled_at", { ascending: true })
        .limit(MAX_ROWS),
      supabase
        .from("service_entries")
        .select("id, service_date, entry_type, cost_cents, mileage_km, is_odometer_correction", {
          count: "exact",
        })
        .eq("vehicle_id", id)
        .order("service_date", { ascending: true })
        .limit(MAX_ROWS),
      supabase
        .from("recurring_costs")
        .select("*", { count: "exact" })
        .eq("vehicle_id", id)
        .limit(MAX_ROWS),
      supabase
        .from("one_off_costs")
        .select("*", { count: "exact" })
        .eq("vehicle_id", id)
        .order("purchased_at", { ascending: true })
        .limit(MAX_ROWS),
    ]);

  const input: AnalysisInput = {
    fuelEntries: ((fuelResult.data ?? []) as FuelEntry[]).map(normalizeFuelEntry),
    serviceEntries: ((serviceResult.data ?? []) as ServiceEntryForAnalysis[]).map(
      (entry) => ({
        ...entry,
        // Zahlenspalten können je nach Treiber als String zurückkommen; ohne
        // diese Umwandlung würde später addiert statt gerechnet
        cost_cents: entry.cost_cents === null ? null : Number(entry.cost_cents),
        mileage_km: Number(entry.mileage_km),
      })
    ),
    recurringCosts: ((recurringResult.data ?? []) as RecurringCost[]).map(
      normalizeRecurringCost
    ),
    oneOffCosts: ((oneOffResult.data ?? []) as OneOffCost[]).map(
      normalizeOneOffCost
    ),
  };

  const truncated = [
    [fuelResult.count, input.fuelEntries.length],
    [serviceResult.count, input.serviceEntries.length],
    [recurringResult.count, input.recurringCosts.length],
    [oneOffResult.count, input.oneOffCosts.length],
  ].some(([total, loaded]) => (total ?? 0) > (loaded ?? 0));

  // Alle Zeiträume auf einmal rechnen: Das Umschalten in der Oberfläche
  // braucht dann keinen weiteren Serveraufruf, und die Aggregation bleibt
  // trotzdem vollständig auf dem Server (Tech Design C2).
  const today = new Date();
  const results = buildPeriods(input, today).map((period) =>
    analyzeCosts(input, period, today)
  );

  return (
    <div className="space-y-6">
      <CostAnalysisView
        vehicleId={id}
        results={results}
        truncated={truncated}
      />
    </div>
  );
}
