import { redirect } from "next/navigation";
import Link from "next/link";
import { Crown } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import { AccountHeader } from "@/components/account-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { DealerInventoryList } from "@/components/dealer-inventory-list";
import { DealerSoldList } from "@/components/dealer-sold-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toCurrency } from "@/lib/currency";
import { isDealer } from "@/lib/dealer-access";
import { getWorkshopVehicleCount } from "@/lib/workshop-access";
import {
  getEffectivePlan,
  hasPremiumAccess,
  isBetaMode,
} from "@/lib/subscription";
import type {
  InventoryVehicle,
  SaleOrigin,
  SoldRecord,
} from "@/lib/dealer-inventory";

export const metadata = {
  title: "Bestand — Oldtimer Docs",
  description: "Fahrzeugbestand mit Standzeit, Einkauf, Verkauf und Rohspanne.",
};

/** Obergrenze der geladenen Bestandsfahrzeuge je Ansicht. */
const MAX_VEHICLES = 200;

interface VehicleRow {
  id: string;
  make: string;
  model: string;
  year: number | null;
  license_plate: string | null;
  currency: string | null;
  created_at: string;
}

interface PurchaseRow {
  vehicle_id: string;
  price_cents: number | null;
  purchased_on: string | null;
}

interface SaleRow {
  id: string;
  make: string;
  model: string;
  year: number | null;
  currency: string | null;
  purchased_on: string | null;
  purchase_price_cents: number | null;
  sold_on: string;
  sale_price_cents: number | null;
  origin: SaleOrigin;
  /** Optional — fehlt bei Uebergaben und nach dem Loeschen des Fahrzeugs */
  vehicle_id: string | null;
}

export default async function BestandPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Der Schalter entscheidet über den Zugang. Wer ihn nicht gesetzt hat, hat
  // hier nichts zu sehen — auch nicht über den direkten Aufruf.
  if (!(await isDealer(supabase, user.id))) {
    redirect("/dashboard");
  }

  const hasWorkshopAccess =
    (await getWorkshopVehicleCount(supabase, user.id)) > 0;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, trial_end, referral_bonus_until")
    .eq("user_id", user.id)
    .single();

  const effectivePlan = subscription
    ? getEffectivePlan(subscription)
    : isBetaMode
      ? "premium"
      : "free";

  // Gewerblich erklärt, aber ohne Premium: Statt der Auswertung der
  // Hinweis aus PROJ-8 — die Angabe selbst bleibt bestehen.
  if (!hasPremiumAccess(effectivePlan)) {
    return (
      <div className="min-h-screen bg-muted/40">
        <AccountHeader
          email={user.email || ""}
          hasWorkshopAccess={hasWorkshopAccess}
        />
        <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
          <h1 className="mb-6 text-2xl font-bold">Bestand</h1>
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertTitle>Der Bestandsbereich gehört zu Premium</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                Standzeit, Einkauf, Verkauf und Rohspanne stehen mit einem
                Premium-Zugang zur Verfügung. Deine Einstellung bleibt
                erhalten.
              </p>
              <Button asChild size="sm">
                <Link href="/settings">Zu den Einstellungen</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </main>
        <MobileBottomNav hasWorkshopAccess={hasWorkshopAccess} />
      </div>
    );
  }

  // Eigene Fahrzeuge — Mitgliedschaften (Werkstatt, Betrachter) gehören
  // nicht zum Bestand.
  const { data: vehicleData } = await supabase
    .from("vehicles")
    .select("id, make, model, year, license_plate, currency, created_at")
    .eq("user_id", user.id)
    .limit(MAX_VEHICLES);

  const vehicleRows = (vehicleData ?? []) as VehicleRow[];
  const ids = vehicleRows.map((v) => v.id);

  // Kaufpreis und Kaufdatum liegen seit PROJ-28 in einer eigenen Tabelle.
  const { data: purchaseData } = ids.length
    ? await supabase
        .from("vehicle_purchases")
        .select("vehicle_id, price_cents, purchased_on")
        .in("vehicle_id", ids)
    : { data: [] };

  const purchases = new Map(
    ((purchaseData ?? []) as PurchaseRow[]).map((p) => [p.vehicle_id, p])
  );

  // Abgeschlossene Vorgänge. Die Tabelle entsteht im Backend-Schritt; bis
  // dahin bleibt die Liste leer, statt die Seite scheitern zu lassen.
  const { data: saleData, error: saleError } = await supabase
    .from("dealer_sales")
    .select(
      "id, make, model, year, currency, purchased_on, purchase_price_cents, sold_on, sale_price_cents, origin, vehicle_id"
    )
    .eq("user_id", user.id)
    .order("sold_on", { ascending: false })
    .limit(MAX_VEHICLES);

  if (saleError) {
    console.error("Dealer sales not available:", saleError.message);
  }

  // QA BUG-1: Fahrzeuge mit einem abgeschlossenen Vorgang gehoeren nicht mehr
  // in den Bestand. Ohne diesen Abgleich stand ein gekennzeichnetes Fahrzeug
  // in beiden Listen, und die Kopfzeile zaehlte es weiter mit.
  const verkaufteIds = new Set(
    ((saleData ?? []) as SaleRow[])
      .map((s) => s.vehicle_id)
      .filter((id): id is string => Boolean(id))
  );

  const vehicles: InventoryVehicle[] = vehicleRows
    .filter((v) => !verkaufteIds.has(v.id))
    .map((v) => {
    const kauf = purchases.get(v.id);
    // Ohne erfasstes Kaufdatum wird ersatzweise das Anlagedatum genommen und
    // als geschätzt gekennzeichnet — sonst hätte ein Fahrzeug ohne
    // Kaufpreis-Eintrag gar keine Standzeit.
    const purchasedOn =
      kauf?.purchased_on ?? v.created_at.split("T")[0] ?? null;

    return {
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      licensePlate: v.license_plate,
      currency: toCurrency(v.currency),
      purchasedOn,
      purchaseDateEstimated: !kauf?.purchased_on,
      purchasePriceCents: kauf?.price_cents ?? null,
    };
  });

  const sales: SoldRecord[] = ((saleData ?? []) as SaleRow[]).map((s) => ({
    id: s.id,
    make: s.make,
    model: s.model,
    year: s.year,
    currency: toCurrency(s.currency),
    purchasedOn: s.purchased_on,
    purchasePriceCents: s.purchase_price_cents,
    soldOn: s.sold_on,
    salePriceCents: s.sale_price_cents,
    origin: s.origin,
  }));

  const today = new Date().toISOString().split("T")[0];
  const ohneKaufpreis = vehicles.filter(
    (v) => v.purchasePriceCents == null
  ).length;

  return (
    <div className="min-h-screen bg-muted/40">
      <AccountHeader
        email={user.email || ""}
        hasWorkshopAccess={hasWorkshopAccess}
      />

      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Bestand</h1>
          <p className="mt-1 text-muted-foreground">
            {vehicles.length === 1
              ? "1 Fahrzeug im Bestand"
              : `${vehicles.length} Fahrzeuge im Bestand`}
          </p>
        </div>

        {ohneKaufpreis > 0 && (
          <Alert className="mb-6">
            <AlertTitle>
              {ohneKaufpreis === 1
                ? "Bei 1 Fahrzeug fehlt der Kaufpreis"
                : `Bei ${ohneKaufpreis} Fahrzeugen fehlt der Kaufpreis`}
            </AlertTitle>
            <AlertDescription>
              Ohne Kaufpreis bleibt die Spanne beim Verkauf leer. Nachtragen
              lässt er sich im Fahrzeug unter „Kosten → Wertentwicklung&ldquo;.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          <DealerInventoryList vehicles={vehicles} today={today} />
          <DealerSoldList records={sales} />
        </div>
      </main>

      <MobileBottomNav hasWorkshopAccess={hasWorkshopAccess} />
    </div>
  );
}
