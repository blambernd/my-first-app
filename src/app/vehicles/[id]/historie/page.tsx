import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { VehicleTimeline } from "@/components/vehicle-timeline";
import type { VehicleMilestoneWithImages } from "@/lib/validations/milestone";

interface HistoriePageProps {
  params: Promise<{ id: string }>;
}

export default async function HistoriePage({ params }: HistoriePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify vehicle ownership or membership and determine role
  let canEdit = true;
  let canEditAll = true;
  const { data: ownedVehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!ownedVehicle) {
    const { data: membership } = await supabase
      .from("vehicle_members")
      .select("vehicle_id, role, can_edit_all")
      .eq("vehicle_id", id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      notFound();
    }
    canEdit = membership.role !== "betrachter";
    canEditAll = membership.role === "besitzer" || (membership.role === "werkstatt" && membership.can_edit_all);
  }

  const { data: vehicleMilestones } = await supabase
    .from("vehicle_milestones")
    .select("*, vehicle_milestone_images(*)")
    .eq("vehicle_id", id)
    .order("milestone_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <VehicleTimeline
      vehicleId={id}
      supabaseUrl={supabaseUrl}
      initialMilestones={
        (vehicleMilestones ?? []) as VehicleMilestoneWithImages[]
      }
      canEdit={canEdit}
      canEditAll={canEditAll}
      userId={user.id}
    />
  );
}
