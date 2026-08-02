import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import {
  getEffectivePlan,
  hasPremiumAccess,
  isBetaMode,
} from "@/lib/subscription";
import { PremiumUpsell } from "@/components/premium-upsell";
import { CostAreaNav } from "@/components/cost-area-nav";
import { ValueDevelopmentView } from "@/components/value-development-view";
import {
  analyzeCosts,
  buildPeriods,
  earliestMonth,
  type AnalysisInput,
  type ServiceEntryForAnalysis,
} from "@/lib/cost-analysis";
import {
  calculateValueDevelopment,
  costsBeforePurchase,
  pickManualMarketValue,
  type ManualMarketValueRow,
} from "@/lib/value-development";
import {
  normalizePurchase,
  normalizeExtraCost,
  type PurchaseExtraCost,
  type VehiclePurchase,
} from "@/lib/validations/vehicle-purchase";
import { normalizeFuelEntry, type FuelEntry } from "@/lib/validations/fuel-entry";
import {
  normalizeRecurringCost,
  type RecurringCost,
} from "@/lib/validations/recurring-cost";
import {
  normalizeOneOffCost,
  type OneOffCost,
} from "@/lib/validations/one-off-cost";

interface WertentwicklungPageProps {
  params: Promise<{ id: string }>;
}

const MAX_ROWS = 2000;

export default async function WertentwicklungPage({
  params,
}: WertentwicklungPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

  // Der Kaufpreis ist die sensibelste Angabe im Produkt — nur der Besitzer.
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
        <CostAreaNav vehicleId={id} />
        <PremiumUpsell
          feature="Wertentwicklung"
          description="Kaufpreis, aufgelaufene Unterhaltskosten und geschätzter Marktwert nebeneinander — die Antwort auf die Frage, was dich das Fahrzeug unterm Strich gekostet hat."
        />
      </div>
    );
  }

  const { data: purchaseRow } = await supabase
    .from("vehicle_purchases")
    .select("*")
    .eq("vehicle_id", id)
    .maybeSingle();

  // Ohne Kaufpreis gibt es keine Bilanz — die Kostenquellen müssen dann gar
  // nicht erst geladen werden.
  if (!purchaseRow) {
    return (
      <div className="space-y-6">
        <CostAreaNav vehicleId={id} />
        <ValueDevelopmentView
          vehicleId={id}
          result={null}
          costsBefore={{ affected: false, earliestMonth: null }}
        />
      </div>
    );
  }

  const purchase = normalizePurchase(purchaseRow as VehiclePurchase);

  const [
    extraResult,
    marketResult,
    fuelResult,
    serviceResult,
    recurringResult,
    oneOffResult,
  ] = await Promise.all([
    supabase
      .from("vehicle_purchase_costs")
      .select("*")
      .eq("purchase_id", purchase.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("vehicle_market_values")
      .select("value_cents, valued_on, note")
      .eq("vehicle_id", id)
      .order("valued_on", { ascending: false })
      .limit(10),
    supabase
      .from("fuel_entries")
      .select("*")
      .eq("vehicle_id", id)
      .limit(MAX_ROWS),
    supabase
      .from("service_entries")
      .select(
        "id, service_date, entry_type, cost_cents, mileage_km, is_odometer_correction"
      )
      .eq("vehicle_id", id)
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
      .limit(MAX_ROWS),
  ]);

  const extraCosts = ((extraResult.data ?? []) as PurchaseExtraCost[]).map(
    normalizeExtraCost
  );

  const input: AnalysisInput = {
    fuelEntries: ((fuelResult.data ?? []) as FuelEntry[]).map(normalizeFuelEntry),
    serviceEntries: ((serviceResult.data ?? []) as ServiceEntryForAnalysis[]).map(
      (entry) => ({
        ...entry,
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

  // Für die Bilanz zählt der gesamte Zeitraum, nicht das laufende Jahr —
  // gefragt ist, was das Fahrzeug insgesamt gekostet hat. `buildPeriods`
  // liefert den Gesamtzeitraum als letzten Eintrag.
  const today = new Date();
  const periods = buildPeriods(input, today);
  const gesamt = analyzeCosts(input, periods[periods.length - 1], today);

  // Der selbst eingetragene Wert ist seit dem Aussetzen der Marktanalyse
  // (2026-08-02) die einzige Quelle für den Marktwert.
  const market = pickManualMarketValue(
    (marketResult.data ?? []) as ManualMarketValueRow[],
    today
  );

  const result = calculateValueDevelopment(
    purchase,
    extraCosts,
    gesamt.totalCents,
    market
  );

  return (
    <div className="space-y-6">
      <CostAreaNav vehicleId={id} />
      <ValueDevelopmentView
        vehicleId={id}
        result={result}
        costsBefore={costsBeforePurchase(
          earliestMonth(input),
          purchase.purchased_on
        )}
      />
    </div>
  );
}
