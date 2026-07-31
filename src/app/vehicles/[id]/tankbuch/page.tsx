import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { FuelLog } from "@/components/fuel-log";
import { normalizeFuelEntry, type FuelEntry } from "@/lib/validations/fuel-entry";

interface TankbuchPageProps {
  params: Promise<{ id: string }>;
}

export default async function TankbuchPage({ params }: TankbuchPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Zugriff prüfen: Besitzer oder Mitglied, und daraus die Rechte ableiten
  let canEdit = true;
  let canDelete = true;

  const { data: ownedVehicle } = await supabase
    .from("vehicles")
    .select("id, mileage_km")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  let vehicleMileageKm: number | null = ownedVehicle?.mileage_km ?? null;

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
    // Löschen bleibt dem Besitzer vorbehalten (PROJ-24 User Story)
    canDelete = false;

    const { data: sharedVehicle } = await supabase
      .from("vehicles")
      .select("mileage_km")
      .eq("id", id)
      .single();
    vehicleMileageKm = sharedVehicle?.mileage_km ?? null;
  }

  const { data: fuelEntries } = await supabase
    .from("fuel_entries")
    .select("*")
    .eq("vehicle_id", id)
    .order("fueled_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <FuelLog
      vehicleId={id}
      initialEntries={((fuelEntries ?? []) as FuelEntry[]).map(normalizeFuelEntry)}
      vehicleMileageKm={vehicleMileageKm}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
