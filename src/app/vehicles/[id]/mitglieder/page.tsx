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
    .select("id")
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

  // Fetch open invitations
  const { data: invitations } = await supabase
    .from("vehicle_invitations")
    .select("*")
    .eq("vehicle_id", id)
    .eq("status", "offen")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <VehicleMembers
      vehicleId={id}
      initialMembers={(members ?? []) as VehicleMember[]}
      initialInvitations={(invitations ?? []) as VehicleInvitation[]}
    />
  );
}
