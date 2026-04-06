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

  // Verify vehicle ownership
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    notFound();
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
    />
  );
}
