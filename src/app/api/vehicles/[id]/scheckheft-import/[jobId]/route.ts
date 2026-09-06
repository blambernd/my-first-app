import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface DocumentJoin {
  page_number: number;
  document: {
    id: string;
    file_name: string;
    storage_path: string;
  } | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  const { id: vehicleId, jobId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  // RLS lässt nur Besitzer und Mitglieder an den Auftrag; findet die Abfrage
  // nichts, ist das entweder ein fremdes Fahrzeug oder ein falscher Auftrag.
  const { data: job } = await supabase
    .from("scheckheft_import_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 });
  }

  const { data: pages } = await supabase
    .from("scheckheft_import_documents")
    .select("page_number, document:vehicle_documents(id, file_name, storage_path)")
    .eq("job_id", jobId)
    .order("page_number", { ascending: true });

  const documents = ((pages ?? []) as unknown as DocumentJoin[])
    .filter((row) => row.document !== null)
    .map((row) => ({
      id: row.document!.id,
      file_name: row.document!.file_name,
      storage_path: row.document!.storage_path,
      page_number: row.page_number,
    }));

  const { data: drafts } = await supabase
    .from("scheckheft_import_drafts")
    .select("*")
    .eq("job_id", jobId)
    .eq("status", "open")
    .order("service_date", { ascending: true, nullsFirst: false });

  return NextResponse.json({ ...job, documents, drafts: drafts ?? [] });
}
