import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ServiceLog } from "@/components/service-log";
import type { ServiceEntry } from "@/lib/validations/service-entry";
import type { VehicleDocument } from "@/lib/validations/vehicle-document";

interface ScheckheftPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ neu?: string; from?: string }>;
}

export default async function ScheckheftPage({ params, searchParams }: ScheckheftPageProps) {
  const { id } = await params;
  const { neu, from } = await searchParams;

  // Schnellaktion aus dem Werkstatt-Dashboard (PROJ-37): Formular direkt
  // öffnen und nach Speichern oder Abbrechen dorthin zurückkehren. Das Ziel
  // wird nicht aus der Adresse übernommen, sondern gegen eine feste Liste
  // geprüft — sonst wäre der Parameter eine offene Weiterleitung.
  const returnTo = from === "werkstatt" ? "/werkstatt" : null;
  const autoNew = neu === "1";
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

  // Fetch documents linked to service entries
  const { data: linkedDocs } = await supabase
    .from("vehicle_documents")
    .select("*")
    .eq("vehicle_id", id)
    .not("service_entry_id", "is", null)
    .order("created_at", { ascending: false });

  const documentsByEntry: Record<string, VehicleDocument[]> = {};
  if (linkedDocs) {
    for (const doc of linkedDocs as VehicleDocument[]) {
      const key = doc.service_entry_id!;
      if (!documentsByEntry[key]) documentsByEntry[key] = [];
      documentsByEntry[key].push(doc);
    }
  }

  return (
    <ServiceLog
      vehicleId={id}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      initialEntries={(serviceEntries ?? []) as ServiceEntry[]}
      documentsByEntry={documentsByEntry}
      canEdit={canEdit}
      canEditAll={canEditAll}
      userId={user.id}
      autoNew={autoNew}
      returnTo={returnTo}
    />
  );
}
