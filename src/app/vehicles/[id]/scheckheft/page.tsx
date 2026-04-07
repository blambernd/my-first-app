import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ServiceLog } from "@/components/service-log";
import type { ServiceEntry } from "@/lib/validations/service-entry";

interface ScheckheftPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScheckheftPage({ params }: ScheckheftPageProps) {
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
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!ownedVehicle) {
    const { data: membership } = await supabase
      .from("vehicle_members")
      .select("vehicle_id")
      .eq("vehicle_id", id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      notFound();
    }
  }

  const { data: serviceEntries } = await supabase
    .from("service_entries")
    .select("*")
    .eq("vehicle_id", id)
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <ServiceLog
      vehicleId={id}
      initialEntries={(serviceEntries ?? []) as ServiceEntry[]}
    />
  );
}
