import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { ScheckheftImportWizard } from "@/components/scheckheft-import-wizard";
import type { ServiceEntry } from "@/lib/validations/service-entry";
import {
  PROVISIONAL_IMPORT_LIMIT_PER_VEHICLE,
  type ImportJob,
  type ImportQuota,
} from "@/lib/validations/scheckheft-import";

interface ImportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScheckheftImportPage({ params }: ImportPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Zugriff prüfen — Betrachter dürfen nicht importieren
  let canEdit = true;
  const { data: ownedVehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!ownedVehicle) {
    const { data: membership } = await supabase
      .from("vehicle_members")
      .select("vehicle_id, role")
      .eq("vehicle_id", id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      notFound();
    }
    canEdit = membership.role !== "betrachter";
  }

  if (!canEdit) {
    redirect(`/vehicles/${id}/scheckheft`);
  }

  // Bestehende Einträge für die Prüfung der Kilometer-Kette
  const { data: serviceEntries } = await supabase
    .from("service_entries")
    .select("service_date, mileage_km, is_odometer_correction")
    .eq("vehicle_id", id)
    .order("service_date", { ascending: true });

  // Offener Auftrag und Kontingent.
  //
  // Die zugehörigen Tabellen entstehen erst mit /backend. Bis dahin liefert
  // Supabase hier einen Fehler statt Daten — das behandeln wir als "kein
  // offener Auftrag", damit die Seite schon vorher benutzbar ist.
  let openJob: ImportJob | null = null;
  let usedPages = 0;

  const { data: jobRow } = await supabase
    .from("scheckheft_import_jobs")
    .select("*, documents:scheckheft_import_documents(*), drafts:scheckheft_import_drafts(*)")
    .eq("vehicle_id", id)
    .in("status", ["queued", "running", "ready"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (jobRow) {
    openJob = jobRow as unknown as ImportJob;
  }

  const { count } = await supabase
    .from("scheckheft_import_documents")
    .select("id", { count: "exact", head: true })
    .eq("vehicle_id", id);

  if (typeof count === "number") {
    usedPages = count;
  }

  const quota: ImportQuota = {
    used: usedPages,
    limit: PROVISIONAL_IMPORT_LIMIT_PER_VEHICLE,
    remaining: Math.max(0, PROVISIONAL_IMPORT_LIMIT_PER_VEHICLE - usedPages),
  };

  return (
    <ScheckheftImportWizard
      vehicleId={id}
      supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      existingEntries={(serviceEntries ?? []) as Pick<
        ServiceEntry,
        "service_date" | "mileage_km" | "is_odometer_correction"
      >[]}
      initialJob={openJob}
      initialQuota={quota}
    />
  );
}
