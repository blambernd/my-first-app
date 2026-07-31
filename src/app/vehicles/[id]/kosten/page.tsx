import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CostAreaNav } from "@/components/cost-area-nav";
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

  // Zugriff prüfen: Besitzer oder Mitglied, daraus die Rechte ableiten
  let canEdit = true;
  let canDelete = true;

  const { data: ownedVehicle } = await supabase
    .from("vehicles")
    .select("id, insurance_company")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  let insuranceCompany: string | null = ownedVehicle?.insurance_company ?? null;

  if (!ownedVehicle) {
    const { data: membership } = await supabase
      .from("vehicle_members")
      .select("vehicle_id, role")
      .eq("vehicle_id", id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      notFound();
    }

    canEdit = membership.role !== "betrachter";
    // Löschen bleibt dem Besitzer vorbehalten, analog zum Tankbuch
    canDelete = false;

    const { data: sharedVehicle } = await supabase
      .from("vehicles")
      .select("insurance_company")
      .eq("id", id)
      .single();
    insuranceCompany = sharedVehicle?.insurance_company ?? null;
  }

  const { data: costs } = await supabase
    .from("recurring_costs")
    .select("*")
    .eq("vehicle_id", id)
    .order("valid_from", { ascending: false })
    .limit(500);

  return (
    <div className="space-y-6">
      <CostAreaNav vehicleId={id} />
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
