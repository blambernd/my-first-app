import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { processImportJob } from "@/lib/scheckheft-import-processor";
import {
  MAX_PAGES_PER_JOB,
  IMPORT_LIMIT_PER_VEHICLE,
  IMPORT_LIMIT_PER_ACCOUNT,
  ACCOUNT_LIMIT_WINDOW_DAYS,
} from "@/lib/scheckheft-import";

const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB, wie im Dokumenten-Archiv
const STORAGE_BUCKET = "vehicle-documents";

function extensionFor(mimeType: string): string {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: vehicleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  // Zugriff: Besitzer oder Werkstatt dürfen importieren, Betrachter nicht
  const { data: owned } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!owned) {
    const { data: membership } = await supabase
      .from("vehicle_members")
      .select("role")
      .eq("vehicle_id", vehicleId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership || !["besitzer", "werkstatt"].includes(membership.role)) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }
  }

  // ------------------------------------------------------------- Dateien
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "Keine Seiten übermittelt" }, { status: 400 });
  }

  if (files.length > MAX_PAGES_PER_JOB) {
    return NextResponse.json(
      { error: `Höchstens ${MAX_PAGES_PER_JOB} Seiten je Vorgang` },
      { status: 400 }
    );
  }

  for (const file of files) {
    if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { error: `Dateityp nicht unterstützt: ${file.name}` },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `${file.name} ist grösser als 10 MB` },
        { status: 400 }
      );
    }
  }

  // ----------------------------------------------------------- Kontingent
  const { count: vehicleUsed } = await supabase
    .from("scheckheft_import_documents")
    .select("id", { count: "exact", head: true })
    .eq("vehicle_id", vehicleId);

  const usedForVehicle = vehicleUsed ?? 0;
  if (usedForVehicle + files.length > IMPORT_LIMIT_PER_VEHICLE) {
    return NextResponse.json(
      {
        error: `Das Kontingent für dieses Fahrzeug reicht nicht aus (${IMPORT_LIMIT_PER_VEHICLE} Seiten, davon ${usedForVehicle} verbraucht).`,
      },
      { status: 429 }
    );
  }

  // Zweite Schranke: Das Fahrzeug-Kontingent allein ist durchlässig, weil
  // Premium-Nutzer beliebig viele Fahrzeuge anlegen dürfen.
  const windowStart = new Date(
    Date.now() - ACCOUNT_LIMIT_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: recentJobs } = await supabase
    .from("scheckheft_import_jobs")
    .select("page_count")
    .eq("created_by", user.id)
    .gte("created_at", windowStart);

  const usedForAccount = (recentJobs ?? []).reduce(
    (sum, row: { page_count: number }) => sum + row.page_count,
    0
  );

  if (usedForAccount + files.length > IMPORT_LIMIT_PER_ACCOUNT) {
    return NextResponse.json(
      {
        error: `Du hast in den letzten ${ACCOUNT_LIMIT_WINDOW_DAYS} Tagen bereits ${usedForAccount} Seiten ausgewertet. Bitte versuche es später noch einmal.`,
      },
      { status: 429 }
    );
  }

  // Ein offener Auftrag je Fahrzeug reicht — sonst konkurrieren Prüfansichten
  const { data: openJob } = await supabase
    .from("scheckheft_import_jobs")
    .select("id")
    .eq("vehicle_id", vehicleId)
    .in("status", ["queued", "running", "ready"])
    .maybeSingle();

  if (openJob) {
    return NextResponse.json(
      { error: "Für dieses Fahrzeug läuft bereits ein Import. Bitte schliesse ihn zuerst ab." },
      { status: 409 }
    );
  }

  // ------------------------------------------------------------- Auftrag
  const { data: job, error: jobError } = await supabase
    .from("scheckheft_import_jobs")
    .insert({
      vehicle_id: vehicleId,
      created_by: user.id,
      status: "queued",
      page_count: files.length,
    })
    .select("*")
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: "Der Auftrag konnte nicht angelegt werden" },
      { status: 500 }
    );
  }

  // --------------------------------------------------- Seiten ins Archiv
  const today = new Date().toISOString().split("T")[0];
  const documents: { id: string; page_number: number }[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const pageNumber = index + 1;
    const storagePath = `${vehicleId}/${crypto.randomUUID()}.${extensionFor(file.type)}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      await supabase.from("scheckheft_import_jobs").delete().eq("id", job.id);
      return NextResponse.json(
        { error: "Eine Seite konnte nicht gespeichert werden" },
        { status: 500 }
      );
    }

    const { data: doc, error: docError } = await supabase
      .from("vehicle_documents")
      .insert({
        vehicle_id: vehicleId,
        title: `Scheckheft-Seite ${pageNumber}`,
        category: "sonstiges",
        document_date: today,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      })
      .select("id")
      .single();

    if (docError || !doc) {
      await supabase.from("scheckheft_import_jobs").delete().eq("id", job.id);
      return NextResponse.json(
        { error: "Eine Seite konnte nicht abgelegt werden" },
        { status: 500 }
      );
    }

    const { error: linkError } = await supabase
      .from("scheckheft_import_documents")
      .insert({
        job_id: job.id,
        vehicle_id: vehicleId,
        document_id: doc.id,
        page_number: pageNumber,
      });

    if (linkError) {
      await supabase.from("scheckheft_import_jobs").delete().eq("id", job.id);
      return NextResponse.json(
        { error: "Eine Seite konnte nicht zugeordnet werden" },
        { status: 500 }
      );
    }

    documents.push({ id: doc.id, page_number: pageNumber });
  }

  // Auswertung sofort anstossen. Die Cron-Route holt Aufträge nach, die hier
  // hängenbleiben — etwa wenn die Funktion in ein Zeitlimit läuft.
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceUrl && serviceKey) {
    after(async () => {
      const serviceClient = createServiceClient(serviceUrl, serviceKey);
      await processImportJob(serviceClient, job.id);
    });
  }

  return NextResponse.json({ ...job, documents, drafts: [] }, { status: 201 });
}
