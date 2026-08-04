import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { TransferPageClient } from "./client";
import { TransferCostNotice } from "@/components/transfer-cost-notice";
import { ChevronLeft } from "lucide-react";
import type { VehicleTransfer } from "@/lib/validations/transfer";
import type { CostStock } from "@/lib/transfer-costs";

interface TransferPageProps {
  params: Promise<{ id: string }>;
}

export default async function TransferPage({ params }: TransferPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Only the owner can access this page
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, make, model, year")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    notFound();
  }

  // Load transfers via RPC (bypasses RLS issues)
  const { data: transferData } = await supabase.rpc("get_vehicle_transfers", {
    p_vehicle_id: id,
  });

  const stock = await zaehleKostendaten(supabase, id);

  const transfers = transferData as { active: VehicleTransfer | null; past: VehicleTransfer[] } | null;
  const activeTransfer = transfers?.active ?? null;
  const pastTransfers = transfers?.past ?? [];

  const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.year})`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/vehicles/${id}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Zurück zum Fahrzeug
        </Link>
        <h2 className="text-xl font-semibold">Fahrzeug übertragen</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Übertrage <strong>{vehicleName}</strong> an einen neuen Besitzer.
          Der Transfer muss vom Empfänger bestätigt werden.
        </p>
      </div>

      {/* Vor dem Formular: Was hier verschwindet, muss der Vorbesitzer wissen,
          bevor er absendet — nicht erst darunter. */}
      <TransferCostNotice vehicleId={id} stock={stock} />

      <TransferPageClient
        vehicleId={id}
        vehicleName={vehicleName}
        activeTransfer={(activeTransfer as VehicleTransfer) ?? null}
        pastTransfers={(pastTransfers as VehicleTransfer[]) ?? []}
      />
    </div>
  );
}

/**
 * Zählt die Bestände, die beim Annehmen verschwinden.
 *
 * „14 laufende Kosten, 23 Einzelkosten" wirkt ungleich stärker als „deine
 * Kostendaten" — dafür sind diese sieben Abfragen da. Sie laufen bewusst
 * **nur hier**, wo ein Transfer tatsächlich vorbereitet wird, und nicht bei
 * jedem Aufruf des Fahrzeugs (F1).
 *
 * `head: true` holt nur die Anzahl, keine Zeilen — die Beträge selbst werden
 * an dieser Stelle nicht gebraucht.
 */
async function zaehleKostendaten(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string
): Promise<CostStock> {
  const basis = (tabelle: string) =>
    supabase
      .from(tabelle)
      .select("id", { count: "exact", head: true })
      .eq("vehicle_id", vehicleId);

  const [
    purchases,
    purchaseExtras,
    recurring,
    oneOff,
    marketValues,
    serviceWithCost,
    fuelWithCost,
  ] = await Promise.all([
    basis("vehicle_purchases"),
    basis("vehicle_purchase_costs"),
    basis("recurring_costs"),
    basis("one_off_costs"),
    basis("vehicle_market_values"),
    // Nur Einträge, an denen tatsächlich ein Betrag hängt: Ein Scheckheft-
    // Eintrag ohne Kostenangabe bleibt unverändert, es gibt nichts zu entfernen.
    basis("service_entries").not("cost_cents", "is", null),
    basis("fuel_entries").not("cost_cents", "is", null),
  ]);

  return {
    hasPurchase: (purchases.count ?? 0) > 0,
    purchaseExtras: purchaseExtras.count ?? 0,
    recurring: recurring.count ?? 0,
    oneOff: oneOff.count ?? 0,
    marketValues: marketValues.count ?? 0,
    serviceWithCost: serviceWithCost.count ?? 0,
    fuelWithCost: fuelWithCost.count ?? 0,
  };
}
