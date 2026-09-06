import type { SupabaseClient } from "@supabase/supabase-js";
import {
  extractEntriesFromPage,
  buildFieldOrigins,
  sanitizeCents,
  sanitizeDate,
  sanitizeMileage,
  sanitizeText,
} from "@/lib/scheckheft-import";

/** Nach dieser Zeit gilt ein laufender Auftrag als hängengeblieben. */
export const STALE_JOB_MINUTES = 15;

const STORAGE_BUCKET = "vehicle-documents";

interface JobRow {
  id: string;
  vehicle_id: string;
  created_by: string;
  status: string;
}

interface PageRow {
  page_number: number;
  document: { storage_path: string; mime_type: string } | null;
}

/**
 * Wertet alle Seiten eines Auftrags aus und legt die Entwürfe an.
 *
 * Läuft sowohl direkt nach dem Hochladen als auch aus der Cron-Route. Der
 * erste Schritt beansprucht den Auftrag über einen bedingten Statuswechsel —
 * damit kann derselbe Auftrag nicht doppelt verarbeitet werden, wenn beide
 * Wege zusammentreffen.
 */
export async function processImportJob(
  supabase: SupabaseClient,
  jobId: string
): Promise<void> {
  // Beanspruchen: nur wer den Wechsel queued -> running gewinnt, arbeitet.
  const { data: claimed } = await supabase
    .from("scheckheft_import_jobs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("status", "queued")
    .select("id, vehicle_id, created_by, status")
    .maybeSingle();

  if (!claimed) return; // schon vergeben oder nicht mehr offen
  const job = claimed as JobRow;

  try {
    const { data: pages } = await supabase
      .from("scheckheft_import_documents")
      .select("page_number, document:vehicle_documents(storage_path, mime_type)")
      .eq("job_id", jobId)
      .order("page_number", { ascending: true });

    const pageRows = (pages ?? []) as unknown as PageRow[];
    if (pageRows.length === 0) {
      await failJob(supabase, jobId, "Zu diesem Auftrag wurden keine Seiten gefunden.");
      return;
    }

    const drafts: Record<string, unknown>[] = [];
    let succeeded = 0;
    let lastError: string | null = null;

    for (const page of pageRows) {
      if (!page.document) continue;
      try {
        const { data: file, error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .download(page.document.storage_path);

        if (error || !file) {
          lastError = "Eine hochgeladene Seite liess sich nicht mehr laden.";
          continue;
        }

        const bytes = new Uint8Array(await file.arrayBuffer());
        const entries = await extractEntriesFromPage(bytes, page.document.mime_type);
        succeeded += 1;

        for (const entry of entries) {
          drafts.push({
            job_id: jobId,
            vehicle_id: job.vehicle_id,
            service_date: sanitizeDate(entry.service_date),
            entry_type: entry.entry_type,
            description: sanitizeText(entry.description, 2000),
            mileage_km: sanitizeMileage(entry.mileage_km),
            workshop_name: sanitizeText(entry.workshop_name, 200),
            cost_cents: sanitizeCents(entry.cost_cents),
            next_due_date: sanitizeDate(entry.next_due_date),
            field_origins: buildFieldOrigins(entry),
            source_page: page.page_number,
            status: "open",
          });
        }
      } catch (err) {
        lastError =
          err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")
            ? "Die Auswertung ist derzeit nicht verfügbar. Bitte versuche es später noch einmal."
            : "Eine Seite konnte nicht ausgewertet werden.";
      }
    }

    // Keine einzige Seite durchgekommen: das ist ein Fehlschlag, kein Ergebnis.
    if (succeeded === 0) {
      await failJob(
        supabase,
        jobId,
        lastError ?? "Keine der hochgeladenen Seiten konnte ausgewertet werden."
      );
      return;
    }

    if (drafts.length > 0) {
      const { error: insertError } = await supabase
        .from("scheckheft_import_drafts")
        .insert(drafts);

      if (insertError) {
        await failJob(
          supabase,
          jobId,
          "Die erkannten Einträge konnten nicht gespeichert werden."
        );
        return;
      }
    }

    await supabase
      .from("scheckheft_import_jobs")
      .update({ status: "ready", completed_at: new Date().toISOString() })
      .eq("id", jobId);

    await notifyReady(supabase, job.created_by, jobId, drafts.length);
  } catch {
    await failJob(
      supabase,
      jobId,
      "Bei der Auswertung ist ein unerwarteter Fehler aufgetreten."
    );
  }
}

async function failJob(
  supabase: SupabaseClient,
  jobId: string,
  reason: string
): Promise<void> {
  await supabase
    .from("scheckheft_import_jobs")
    .update({
      status: "failed",
      error_reason: reason,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

async function notifyReady(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  draftCount: number
): Promise<void> {
  const message =
    draftCount === 0
      ? "Deine Seiten wurden ausgewertet — es liess sich allerdings kein Eintrag erkennen."
      : draftCount === 1
        ? "Deine Seiten wurden ausgewertet: 1 Eintrag liegt zur Prüfung bereit."
        : `Deine Seiten wurden ausgewertet: ${draftCount} Einträge liegen zur Prüfung bereit.`;

  // Scheitert die Benachrichtigung, ist der Auftrag trotzdem fertig — der
  // Nutzer findet ihn beim nächsten Besuch des Scheckhefts.
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "scheckheft_import_ready",
    reference_id: jobId,
    message,
  });
}

/**
 * Auffangnetz: holt Aufträge zurück, die beim sofortigen Start
 * hängengeblieben sind — etwa weil die Funktion in ein Zeitlimit lief.
 */
export async function reclaimStaleJobs(
  supabase: SupabaseClient
): Promise<string[]> {
  const threshold = new Date(
    Date.now() - STALE_JOB_MINUTES * 60 * 1000
  ).toISOString();

  const { data: stale } = await supabase
    .from("scheckheft_import_jobs")
    .select("id, status, started_at, created_at")
    .in("status", ["queued", "running"])
    .lt("created_at", threshold)
    .limit(10);

  const ids: string[] = [];
  for (const row of (stale ?? []) as { id: string }[]) {
    // Zurück auf "queued", damit processImportJob den Auftrag beanspruchen kann
    await supabase
      .from("scheckheft_import_jobs")
      .update({ status: "queued", started_at: null })
      .eq("id", row.id);
    ids.push(row.id);
  }
  return ids;
}
