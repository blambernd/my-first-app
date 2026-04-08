import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { VehicleMembers } from "@/components/vehicle-members";
import type { VehicleMember, VehicleInvitation } from "@/lib/validations/member";

interface MitgliederPageProps {
  params: Promise<{ id: string }>;
}

export default async function MitgliederPage({ params }: MitgliederPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Only the owner can see this page
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, make, model, year")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    notFound();
  }

  // Fetch members with user emails via a join or separate query
  const { data: members } = await supabase
    .from("vehicle_members")
    .select("*")
    .eq("vehicle_id", id)
    .order("joined_at", { ascending: true })
    .limit(50);

  // Fetch all invitations via RPC (bypasses RLS)
  const { data: invitations } = await supabase.rpc("get_vehicle_invitations", {
    p_vehicle_id: id,
  });

  const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.year})`;

  return (
    <VehicleMembers
      vehicleId={id}
      vehicleName={vehicleName}
      initialMembers={(members ?? []) as VehicleMember[]}
      initialInvitations={(invitations ?? []) as VehicleInvitation[]}
    />
  );
}
