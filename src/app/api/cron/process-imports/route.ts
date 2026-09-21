/**
 * Verarbeitet offene Scheckheft-Importe (PROJ-35).
 *
 * ## Diese Route hat KEINEN Cron-Eintrag mehr
 *
 * Bis zum 2026-09-21 stand in vercel.json ein Eintrag, der diese Route alle
 * zehn Minuten aufrief. Auf einem Hobby-Konto sind nur **tägliche**
 * Cron-Läufe erlaubt — Vercel lehnt deshalb **jedes Deployment ab, das diese
 * Datei enthält**, noch bevor ein Build startet:
 *
 *     cron_jobs_limits_reached — Hobby accounts are limited to daily
 *     cron jobs. This cron expression would run more than once per day.
 *
 * Die Ablehnung erzeugt keinen fehlgeschlagenen Build, sondern gar keinen
 * Eintrag. Dadurch blieb sie zwei Wochen unbemerkt: Seit dem 2026-09-06
 * wurde jeder Push still verworfen, und zwei fertige Features kamen nicht
 * in Produktion.
 *
 * **Wer den Eintrag wieder einträgt, legt damit die gesamte Auslieferung
 * still.** Möglich sind: ein täglicher Takt (z. B. `0 3 * * *`), ein
 * externer Aufruf dieser Route, oder der Pro-Plan.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  processImportJob,
  reclaimStaleJobs,
} from "@/lib/scheckheft-import-processor";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * Auffangnetz für den Scheckheft-Import (PROJ-35).
 *
 * Die Auswertung startet normalerweise direkt nach dem Hochladen. Läuft die
 * Funktion dabei in ein Zeitlimit, bliebe der Auftrag ohne diese Route für
 * immer auf "läuft" stehen — und das Kontingent wäre verbrannt, ohne dass der
 * Nutzer je ein Ergebnis sieht.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service client not configured" },
      { status: 500 }
    );
  }

  const reclaimed = await reclaimStaleJobs(supabase);

  let processed = 0;
  for (const jobId of reclaimed) {
    await processImportJob(supabase, jobId);
    processed += 1;
  }

  return NextResponse.json({ reclaimed: reclaimed.length, processed });
}
