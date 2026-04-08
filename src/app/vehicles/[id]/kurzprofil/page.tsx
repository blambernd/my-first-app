import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ProfileConfigurator } from "@/components/profile-configurator";

interface KurzprofilPageProps {
  params: Promise<{ id: string }>;
}

export default async function KurzprofilPage({ params }: KurzprofilPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify ownership
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    notFound();
  }

  // Fetch all data the configurator needs for item selection
  const [imagesResult, serviceEntriesResult, milestonesResult, documentsResult] =
    await Promise.all([
      supabase
        .from("vehicle_images")
        .select("id, storage_path, position")
        .eq("vehicle_id", id)
        .order("position"),
      supabase
        .from("service_entries")
        .select("id, title, service_date")
        .eq("vehicle_id", id)
        .order("service_date", { ascending: false }),
      supabase
        .from("vehicle_milestones")
        .select("id, title, milestone_date")
        .eq("vehicle_id", id)
        .order("milestone_date", { ascending: false }),
      supabase
        .from("vehicle_documents")
        .select("id, title, category")
        .eq("vehicle_id", id)
        .order("document_date", { ascending: false }),
    ]);

  return (
    <ProfileConfigurator
      vehicleId={id}
      images={imagesResult.data || []}
      serviceEntries={serviceEntriesResult.data || []}
      milestones={milestonesResult.data || []}
      documents={documentsResult.data || []}
    />
  );
}
