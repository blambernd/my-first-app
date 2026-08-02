import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { RecurringCostList } from "@/components/recurring-cost-list";
import {
  normalizeRecurringCost,
  type RecurringCost,
} from "@/lib/validations/recurring-cost";

interface KostenPageProps {
  params: Promise<{ id: string }>;
}

export default async function KostenPage({ params }: KostenPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Der gesamte Kostenbereich ist dem Besitzer vorbehalten (PROJ-27, C10).
  // Kosten sind sensibler als die Wartungshistorie: Eine eingeladene Werkstatt
  // soll nicht sehen, was der Besitzer anderswo bezahlt hat. Die Regeln in der
  // Datenbank setzen dasselbe durch — diese Prüfung sorgt nur dafür, dass ein
  // Mitglied eine klare Absage bekommt statt einer leeren Liste.
  const { data: ownedVehicle } = await supabase
    .from("vehicles")
    .select("id, insurance_company")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ownedVehicle) {
    notFound();
  }

  const insuranceCompany: string | null = ownedVehicle.insurance_company ?? null;
  const canEdit = true;
  const canDelete = true;

  const { data: costs } = await supabase
    .from("recurring_costs")
    .select("*")
    .eq("vehicle_id", id)
    .order("valid_from", { ascending: false })
    .limit(500);

  return (
    <div className="space-y-6">
      <RecurringCostList
        vehicleId={id}
        initialCosts={((costs ?? []) as RecurringCost[]).map(
          normalizeRecurringCost
        )}
        insuranceCompany={insuranceCompany}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
