import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { MarketAnalysis } from "@/components/market-analysis";
import type { Vehicle } from "@/lib/validations/vehicle";

interface MarktpreisPageProps {
  params: Promise<{ id: string }>;
}

export default async function MarktpreisPage({ params }: MarktpreisPageProps) {
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
    .select("id, make, model, year, factory_code, mileage_km")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  let vehicle: Pick<Vehicle, "id" | "make" | "model" | "year" | "factory_code" | "mileage_km">;

  if (ownedVehicle) {
    vehicle = ownedVehicle;
  } else {
    const { data: membership } = await supabase
      .from("vehicle_members")
      .select("vehicle_id, vehicles(id, make, model, year, factory_code, mileage_km)")
      .eq("vehicle_id", id)
      .eq("user_id", user.id)
      .single();

    if (!membership?.vehicles) {
      notFound();
    }

    vehicle = membership.vehicles as unknown as Pick<Vehicle, "id" | "make" | "model" | "year" | "factory_code" | "mileage_km">;
  }

  return (
    <MarketAnalysis
      vehicleId={vehicle.id}
      vehicleMake={vehicle.make}
      vehicleModel={vehicle.model}
      vehicleYear={vehicle.year}
      vehicleFactoryCode={vehicle.factory_code}
      vehicleMileageKm={vehicle.mileage_km}
    />
  );
}
