import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CostOverviewView } from "@/components/cost-overview-view";
import {
  analyzeCosts,
  buildOverviewPeriod,
  latestMonth,
  longMonthLabel,
  type AnalysisInput,
  type ServiceEntryForAnalysis,
} from "@/lib/cost-analysis";
import { buildCostOverview } from "@/lib/cost-overview";
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

interface KostenUeberblickPageProps {
  params: Promise<{ id: string }>;
}

const MAX_ROWS = 2000;

/**
 * Einstieg in den Kostenbereich (PROJ-31).
 *
 * Beantwortet in vier Zahlen, was das Fahrzeug kostet, und verzweigt von dort
 * in die Detailbereiche. Bis zum 2026-08-03 lag hier „Laufende Kosten"; die
 * Liste hat einen eigenen Unterpfad bekommen.
 *
 * **Frei zugänglich, anders als Auswertung und Wertentwicklung.** Der Überblick
 * ist der Einstieg in den Kostenbereich: Vor PROJ-31 landete ein Klick auf
 * „Kosten" bei den laufenden Kosten, die frei sind. Läge hier eine Schranke,
 * sähe ein Nutzer ohne Premium eine Werbewand statt seiner eigenen Daten —
 * obwohl die freien Unterbereiche direkt darunter stehen. Die Tiefe kostet
 * weiterhin: Von hier führen Wege in die Auswertung und die Wertentwicklung,
 * und dort greift die Schranke.
 *
 * Serverseitig gerechnet wie Auswertung und Wertentwicklung: Die Seite kommt
 * fertig an, es gibt kein Nachladen und keine springenden Zahlen. Die
 * Aggregation kostet unter 4 ms (in PROJ-27 an 868 Datensätzen gemessen) —
 * die Seitenzeit besteht praktisch nur aus den Wegen zur Datenbank.
 */
export default async function KostenUeberblickPage({
  params,
}: KostenUeberblickPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: ownedVehicle } = await supabase
    .from("vehicles")
    // costs_cleared_at unterscheidet für den neuen Besitzer „wurde beim
    // Besitzerwechsel entfernt" von „wurde nie erfasst" (PROJ-32).
    .select("id, costs_cleared_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  // Der gesamte Kostenbereich ist dem Besitzer vorbehalten (PROJ-27, C10).
  // Die Regeln in der Datenbank setzen dasselbe durch — diese Prüfung sorgt
  // nur dafür, dass ein Mitglied eine klare Absage bekommt.
  if (!ownedVehicle) {
    notFound();
  }

  const [fuelResult, serviceResult, recurringResult, oneOffResult] =
    await Promise.all([
      supabase
        .from("fuel_entries")
        .select("*")
        .eq("vehicle_id", id)
        .order("fueled_at", { ascending: true })
        .limit(MAX_ROWS),
      supabase
        .from("service_entries")
        .select(
          "id, service_date, entry_type, cost_cents, mileage_km, is_odometer_correction"
        )
        .eq("vehicle_id", id)
        .order("service_date", { ascending: true })
        .limit(MAX_ROWS),
      supabase
        .from("recurring_costs")
        .select("*")
        .eq("vehicle_id", id)
        .limit(MAX_ROWS),
      supabase
        .from("one_off_costs")
        .select("*")
        .eq("vehicle_id", id)
        .order("purchased_at", { ascending: true })
        .limit(MAX_ROWS),
    ]);

  const input: AnalysisInput = {
    fuelEntries: ((fuelResult.data ?? []) as FuelEntry[]).map(normalizeFuelEntry),
    serviceEntries: ((serviceResult.data ?? []) as ServiceEntryForAnalysis[]).map(
      (entry) => ({
        ...entry,
        // Zahlenspalten kommen je nach Treiber als String zurück
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

  const today = new Date();
  const period = buildOverviewPeriod(input, today);
  // Dieselbe Rechenlogik wie die Auswertung, nur ein anderer Zeitraum —
  // damit beide Seiten für dieselben Daten nicht auseinanderlaufen.
  const analysis = analyzeCosts(input, period, today);
  const overview = buildCostOverview(analysis, period.monthsCovered);

  // Liegt im Zeitraum nichts, aber anderswo schon: Der Nutzer hat erfasst,
  // nur eben frueher. Ihn zum Anfangen aufzufordern waere falsch (QA BUG-1).
  const letzter = latestMonth(input);
  const lastEntryLabel =
    overview.isEmpty && letzter && letzter < period.fromMonth
      ? longMonthLabel(letzter)
      : null;

  return (
    <CostOverviewView
      vehicleId={id}
      overview={overview}
      periodLabel={period.label}
      shortened={period.shortened}
      lastEntryLabel={lastEntryLabel}
      costsClearedAt={ownedVehicle.costs_cleared_at ?? null}
    />
  );
}
