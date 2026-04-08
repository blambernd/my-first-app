import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { DocumentArchive } from "@/components/document-archive";
import type { VehicleDocument } from "@/lib/validations/vehicle-document";
import type { ServiceEntry } from "@/lib/validations/service-entry";

interface DokumentePageProps {
  params: Promise<{ id: string }>;
}

export default async function DokumentePage({ params }: DokumentePageProps) {
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

  const { data: vehicleDocuments } = await supabase
    .from("vehicle_documents")
    .select("*")
    .eq("vehicle_id", id)
    .order("document_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: serviceEntries } = await supabase
    .from("service_entries")
    .select("*")
    .eq("vehicle_id", id)
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <DocumentArchive
      vehicleId={id}
      initialDocuments={(vehicleDocuments ?? []) as VehicleDocument[]}
      serviceEntries={(serviceEntries ?? []) as ServiceEntry[]}
      supabaseUrl={supabaseUrl}
      canEdit={canEdit}
      canEditAll={canEditAll}
      userId={user.id}
    />
  );
}
