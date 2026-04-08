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

  const { data: serviceEntries } = await supabase
    .from("service_entries")
    .select("*")
    .eq("vehicle_id", id)
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  // Fetch document counts per service entry
  const { data: docCounts } = await supabase
    .from("vehicle_documents")
    .select("service_entry_id, id")
    .eq("vehicle_id", id)
    .not("service_entry_id", "is", null);

  const documentCountMap: Record<string, number> = {};
  if (docCounts) {
    for (const doc of docCounts) {
      const key = doc.service_entry_id!;
      documentCountMap[key] = (documentCountMap[key] || 0) + 1;
    }
  }

  return (
    <ServiceLog
      vehicleId={id}
      initialEntries={(serviceEntries ?? []) as ServiceEntry[]}
      documentCounts={documentCountMap}
      canEdit={canEdit}
      canEditAll={canEditAll}
      userId={user.id}
    />
  );
}
