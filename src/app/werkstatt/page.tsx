import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import { getWorkshopVehicleCount, isWorkshop } from "@/lib/workshop-access";
import { getCustomerVehicles, type CustomerVehicle } from "@/lib/workshop-customers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AccountHeader } from "@/components/account-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { WorkshopDueList } from "@/components/workshop-due-list";
import { WorkshopVehicleList } from "@/components/workshop-vehicle-list";
import { WorkshopCustomerVehicleList } from "@/components/workshop-customer-vehicle-list";
import { toCurrency } from "@/lib/currency";
import {
  buildDueList,
  dueLabel,
  vehicleLabel,
  type DueSource,
  type WorkshopDue,
  type WorkshopVehicle,
} from "@/lib/workshop-dashboard";

export const metadata = {
  title: "Werkstatt — Oldtimer Docs",
  description: "Übersicht über alle betreuten Kundenfahrzeuge und anstehenden Arbeiten.",
};

/**
 * Rückgabe von `get_workshop_dashboard()` (PROJ-37).
 *
 * Die Funktion verdichtet bereits in der Datenbank: je Fahrzeug eine Zeile,
 * keine Einträge. Beträge sind dort auf die eigenen Einträge des anrufenden
 * Nutzers gefiltert — fremde verlassen die Datenbank nicht.
 */
interface DashboardRow {
  id: string;
  make: string;
  model: string;
  year: number | null;
  license_plate: string | null;
  currency: string | null;
  last_mileage_km: number | null;
  last_entry_date: string | null;
  own_entry_count: number;
  own_cost_cents: number | null;
  next_due_label_key: string | null;
  next_due_date: string | null;
  next_due_source: DueSource | null;
}

interface DashboardDue {
  vehicle_id: string;
  label_key: string;
  due_date: string;
  source: DueSource;
}

interface DashboardPayload {
  vehicles: DashboardRow[];
  dues: DashboardDue[];
  /** Zahl aller betreuten Fahrzeuge — ohne die Begrenzung der Liste (QA BUG-3) */
  total_vehicle_count: number;
}

export default async function WerkstattPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Zwei unabhängige Wege führen hierher (PROJ-39): die Einladung eines
  // Besitzers oder die eigene Selbstauskunft. Beide werden vor allem
  // anderen geprüft.
  //
  // QA BUG-9 (PROJ-37): Die Rolle wird VOR der Übersicht ermittelt, in einer
  // eigenen, billigen Zählabfrage. Vorher behauptete der Fehlerzweig einen
  // Werkstattzugang, den er nicht kennen konnte — die Abfrage, die ihn
  // belegen würde, war ja gerade fehlgeschlagen. Ein Nutzer ohne jede
  // Werkstatt-Rolle bekam dadurch Navigationspunkt und Störungsmeldung zu
  // sehen, die beide von Kundenfahrzeugen sprachen, die es nicht gibt.
  const [betreuteFahrzeuge, werkstattModus] = await Promise.all([
    getWorkshopVehicleCount(supabase, user.id),
    isWorkshop(supabase, user.id),
  ]);

  if (betreuteFahrzeuge === 0 && !werkstattModus) {
    redirect("/dashboard");
  }

  // Eigene Kundenfahrzeuge nur für erklärte Werkstätten. Ohne die
  // Selbstauskunft wäre das schlicht die private Fahrzeugsammlung, die ins
  // Dashboard gehört und nicht hierher.
  const eigeneFahrzeuge: CustomerVehicle[] = werkstattModus
    ? await getCustomerVehicles(supabase, user.id)
    : [];

  // Die Übersicht der betreuten Fahrzeuge wird nur abgefragt, wenn es
  // welche gibt. Eine Werkstatt, die gerade erst angefangen hat, hat noch
  // keine einzige Einladung — für sie ist die Abfrage überflüssig.
  let betreute: WorkshopVehicle[] = [];
  let dues: WorkshopDue[] = [];
  let gesamtBetreut = 0;
  let uebersichtGestoert = false;

  if (betreuteFahrzeuge > 0) {
    const { data, error } = await supabase.rpc("get_workshop_dashboard");

    // QA BUG-1 (PROJ-37): Ein Ausfall der Abfrage darf nicht aussehen wie
    // „keine Kundenfahrzeuge". Vorher landete der Nutzer in beiden Fällen
    // stumm im Dashboard — ein Totalausfall wäre im Betrieb nie gemeldet
    // worden, weil die Anwendung ihn nicht als solchen zeigte.
    if (error) {
      console.error("Workshop dashboard RPC error:", error);
      uebersichtGestoert = true;
    } else {
      const payload = (data ?? {
        vehicles: [],
        dues: [],
        total_vehicle_count: 0,
      }) as DashboardPayload;
      const rows = payload.vehicles ?? [];

      const labelById = new Map(
        rows.map((r) => [
          r.id,
          vehicleLabel({ make: r.make, model: r.model, year: r.year }),
        ])
      );

      betreute = rows.map((r) => ({
        id: r.id,
        make: r.make,
        model: r.model,
        year: r.year,
        licensePlate: r.license_plate,
        currency: toCurrency(r.currency),
        lastMileageKm: r.last_mileage_km,
        lastEntryDate: r.last_entry_date,
        ownEntryCount: r.own_entry_count ?? 0,
        ownCostCents: r.own_cost_cents,
        nextDue:
          r.next_due_date && r.next_due_source
            ? {
                vehicleId: r.id,
                vehicleLabel: labelById.get(r.id) ?? "",
                label: dueLabel(r.next_due_source, r.next_due_label_key ?? ""),
                dueDate: r.next_due_date,
                source: r.next_due_source,
              }
            : null,
      }));

      dues = (payload.dues ?? []).map((d) => ({
        vehicleId: d.vehicle_id,
        vehicleLabel: labelById.get(d.vehicle_id) ?? "",
        label: dueLabel(d.source, d.label_key),
        dueDate: d.due_date,
        source: d.source,
      }));

      gesamtBetreut = payload.total_vehicle_count ?? betreute.length;
    }
  }

  // Hat jemand weder eigene noch betreute Fahrzeuge und ist auch keine
  // erklärte Werkstatt, wurde ihm der Zugriff zwischen den Abfragen
  // entzogen. Ein Fehlerfall kommt hier nicht mehr an, der ist oben
  // abgefangen.
  if (!werkstattModus && betreute.length === 0 && !uebersichtGestoert) {
    redirect("/dashboard");
  }

  // Der Stichtag wird einmal serverseitig gesetzt und durchgereicht, damit
  // Terminliste und Fahrzeugliste denselben „heute"-Begriff verwenden.
  const today = new Date().toISOString().split("T")[0];
  const dueList = buildDueList(dues, new Date(`${today}T00:00:00Z`));

  // Die Gesamtzahl kommt ungekürzt aus der Datenbank; die Liste ist auf 100
  // begrenzt. Beides auseinanderzuhalten ist der Kern von QA BUG-3.
  const gekuerzt = gesamtBetreut > betreute.length;

  return (
    <div className="bg-muted/40 min-h-screen">
      <AccountHeader email={user.email || ""} hasWorkshopAccess />

      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Werkstatt</h1>
          <p className="text-muted-foreground mt-1">
            <Bestandszeile eigene={eigeneFahrzeuge.length} betreut={gesamtBetreut} />
          </p>
        </div>

        {uebersichtGestoert && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              Die betreuten Fahrzeuge konnten nicht geladen werden
            </AlertTitle>
            <AlertDescription>
              Deine Kundenfahrzeuge sind davon nicht betroffen — es ist nur
              diese Ansicht, die gerade nicht antwortet. Bitte versuche es
              später erneut. Über{" "}
              <Link href="/dashboard" className="underline">
                das Dashboard
              </Link>{" "}
              erreichst du deine Fahrzeuge weiterhin.
            </AlertDescription>
          </Alert>
        )}

        {/* QA BUG-3: Die Liste ist begrenzt. Vorher behauptete die Kopfzeile
            bei 130 betreuten Fahrzeugen „100 betreute Kundenfahrzeuge" — die
            Kürzung war nirgends zu erkennen. */}
        {gekuerzt && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Nicht alle Fahrzeuge werden angezeigt</AlertTitle>
            <AlertDescription>
              Von {gesamtBetreut} betreuten Fahrzeugen sind hier die ersten{" "}
              {betreute.length} aufgeführt (alphabetisch nach Marke und
              Modell). Die Terminübersicht bezieht sich ebenfalls nur auf
              diese Fahrzeuge.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          <WorkshopDueList dues={dueList} today={today} />

          {/* Eigene zuerst: Dort ist die Werkstatt Besitzer und kann alles,
              was sie im Alltag braucht. Die betreuten Fahrzeuge sind der
              Sonderfall, nicht die Regel. */}
          {werkstattModus && (
            <WorkshopCustomerVehicleList vehicles={eigeneFahrzeuge} />
          )}

          {(betreute.length > 0 || !werkstattModus) && (
            <WorkshopVehicleList vehicles={betreute} today={today} />
          )}
        </div>
      </main>

      <MobileBottomNav hasWorkshopAccess />
    </div>
  );
}

/**
 * Die Zeile unter der Überschrift.
 *
 * Zählt beide Gruppen getrennt, weil sie verschiedene Dinge sind: eigene
 * Fahrzeuge gehören der Werkstatt, betreute gehören dem Kunden. Eine
 * Gesamtzahl würde diesen Unterschied einebnen.
 */
function Bestandszeile({
  eigene,
  betreut,
}: {
  eigene: number;
  betreut: number;
}) {
  const teile: string[] = [];

  if (eigene > 0) {
    teile.push(eigene === 1 ? "1 eigenes Kundenfahrzeug" : `${eigene} eigene Kundenfahrzeuge`);
  }
  if (betreut > 0) {
    teile.push(betreut === 1 ? "1 betreutes Fahrzeug" : `${betreut} betreute Fahrzeuge`);
  }

  if (teile.length === 0) {
    return <>Noch keine Fahrzeuge — leg dein erstes Kundenfahrzeug an.</>;
  }

  return <>{teile.join(" · ")}</>;
}
