import { redirect, notFound } from "next/navigation";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { createClient } from "@/lib/supabase-server";
import { CostAreaNav } from "@/components/cost-area-nav";
import { OneOffCostList } from "@/components/one-off-cost-list";
import type { ServiceEntryOption } from "@/components/one-off-cost-form";
import {
  normalizeOneOffCost,
  type OneOffCost,
} from "@/lib/validations/one-off-cost";
import { getEntryTypeLabel } from "@/lib/validations/service-entry";

interface EinzelkostenPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Obergrenze für geladene Einträge. Die Kennzahlen decken nur die geladenen
 * Einträge ab — deshalb wird zusätzlich die Gesamtzahl abgefragt und die
 * Oberfläche weist offen darauf hin, falls abgeschnitten wurde. In PROJ-24
 * fehlte dieser Hinweis, weshalb dort eine Kennzahl „gesamt" hieß, ohne es zu
 * sein (offener Befund BUG-2).
 */
const MAX_ENTRIES = 1000;

export default async function EinzelkostenPage({ params }: EinzelkostenPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Der gesamte Kostenbereich ist dem Besitzer vorbehalten (PROJ-27, C10).
  // Die Regeln in der Datenbank setzen dasselbe durch — diese Prüfung sorgt nur
  // dafür, dass ein Mitglied eine klare Absage bekommt statt einer leeren Liste.
  const { data: ownedVehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ownedVehicle) {
    notFound();
  }

  const canEdit = true;
  const canDelete = true;

  const { data: costs, count } = await supabase
    .from("one_off_costs")
    .select("*", { count: "exact" })
    .eq("vehicle_id", id)
    .order("purchased_at", { ascending: false })
    .limit(MAX_ENTRIES);

  // Scheckheft-Einträge für die optionale Zuordnung
  const { data: serviceEntries } = await supabase
    .from("service_entries")
    .select("id, service_date, entry_type, description")
    .eq("vehicle_id", id)
    .order("service_date", { ascending: false })
    .limit(200);

  const serviceEntryOptions: ServiceEntryOption[] = (serviceEntries ?? []).map(
    (entry: {
      id: string;
      service_date: string;
      entry_type: string;
      description: string;
    }) => ({
      id: entry.id,
      label: `${format(
        parse(entry.service_date, "yyyy-MM-dd", new Date()),
        "dd.MM.yyyy",
        { locale: de }
      )} — ${getEntryTypeLabel(
        entry.entry_type as Parameters<typeof getEntryTypeLabel>[0]
      )}: ${entry.description.slice(0, 40)}`,
    })
  );

  return (
    <div className="space-y-6">
      <CostAreaNav vehicleId={id} />
      <OneOffCostList
        vehicleId={id}
        initialCosts={((costs ?? []) as OneOffCost[]).map(normalizeOneOffCost)}
        serviceEntries={serviceEntryOptions}
        totalInDatabase={count ?? (costs ?? []).length}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
