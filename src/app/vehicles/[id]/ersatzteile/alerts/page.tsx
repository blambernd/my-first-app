import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { PartsAlertList } from "@/components/parts-alert-list";
import type { Vehicle } from "@/lib/validations/vehicle";
import type { PartAlert } from "@/lib/validations/parts";

interface AlertsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AlertsPage({ params }: AlertsPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify vehicle ownership or membership
  const { data: ownedVehicle } = await supabase
    .from("vehicles")
    .select("id, make, model, year")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  let vehicle: Pick<Vehicle, "id" | "make" | "model" | "year">;

  if (ownedVehicle) {
    vehicle = ownedVehicle;
  } else {
    const { data: membership } = await supabase
      .from("vehicle_members")
      .select("vehicle_id, vehicles(id, make, model, year)")
      .eq("vehicle_id", id)
      .eq("user_id", user.id)
      .single();

    if (!membership?.vehicles) {
      notFound();
    }

    vehicle = membership.vehicles as unknown as Pick<Vehicle, "id" | "make" | "model" | "year">;
  }

  // Fetch alerts for this vehicle
  const { data: alerts } = await supabase
    .from("part_alerts")
    .select("*")
    .eq("vehicle_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <PartsAlertList
      vehicleId={vehicle.id}
      vehicleMake={vehicle.make}
      vehicleModel={vehicle.model}
      vehicleYear={vehicle.year}
      initialAlerts={(alerts ?? []) as PartAlert[]}
    />
  );
}
