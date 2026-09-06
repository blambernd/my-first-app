import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { z } from "zod";

const entrySchema = z.object({
  id: z.string().uuid(),
  service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum ist erforderlich"),
  entry_type: z.enum([
    "inspection",
    "oil_change",
    "repair",
    "tuv_hu",
    "restoration",
    "other",
  ]),
  description: z.string().max(2000).nullable().optional(),
  mileage_km: z.number().int().min(0).max(9999999),
  workshop_name: z.string().max(200).nullable().optional(),
  cost_cents: z.number().int().min(0).nullable().optional(),
  next_due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  is_odometer_correction: z.boolean().optional().default(false),
});

const confirmSchema = z.object({
  entries: z.array(entrySchema).min(1, "Kein Eintrag ausgewählt"),
});

export async function POST(
  request: Request,
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

  // Nur Besitzer und Werkstatt dürfen Einträge anlegen
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

  const { data: job } = await supabase
    .from("scheckheft_import_jobs")
    .select("id, status")
    .eq("id", jobId)
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 });
  }

  if (job.status !== "ready") {
    return NextResponse.json(
      { error: "Dieser Auftrag steht nicht zur Übernahme bereit" },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  // Nur Entwürfe dieses Auftrags dürfen übernommen werden — sonst liesse sich
  // über eine fremde Entwurfs-ID ein Eintrag in ein anderes Fahrzeug schreiben.
  const { data: ownDrafts } = await supabase
    .from("scheckheft_import_drafts")
    .select("id")
    .eq("job_id", jobId)
    .eq("status", "open");

  const allowedIds = new Set((ownDrafts ?? []).map((d: { id: string }) => d.id));
  const unknownEntry = parsed.data.entries.find((e) => !allowedIds.has(e.id));
  if (unknownEntry) {
    return NextResponse.json(
      { error: "Ein ausgewählter Eintrag gehört nicht zu diesem Auftrag" },
      { status: 400 }
    );
  }

  // Chronologisch anlegen, damit die Kilometer-Kette in der richtigen
  // Reihenfolge entsteht (PROJ-3)
  const entries = [...parsed.data.entries].sort((a, b) =>
    a.service_date.localeCompare(b.service_date)
  );

  const rows = entries.map((entry) => ({
    vehicle_id: vehicleId,
    service_date: entry.service_date,
    entry_type: entry.entry_type,
    description: entry.description ?? null,
    mileage_km: entry.mileage_km,
    is_odometer_correction: entry.is_odometer_correction,
    cost_cents: entry.cost_cents ?? null,
    workshop_name: entry.workshop_name ?? null,
    next_due_date: entry.next_due_date ?? null,
    created_by: user.id,
  }));

  const { data: created, error: insertError } = await supabase
    .from("service_entries")
    .insert(rows)
    .select("id");

  if (insertError || !created) {
    return NextResponse.json(
      { error: "Die Einträge konnten nicht angelegt werden" },
      { status: 500 }
    );
  }

  // Beleg allen erzeugten Einträgen zuordnen — ein Dokument auf viele Einträge
  const { data: pages } = await supabase
    .from("scheckheft_import_documents")
    .select("document_id")
    .eq("job_id", jobId);

  const links: { service_entry_id: string; document_id: string; vehicle_id: string }[] =
    [];
  for (const entry of created as { id: string }[]) {
    for (const page of (pages ?? []) as { document_id: string }[]) {
      links.push({
        service_entry_id: entry.id,
        document_id: page.document_id,
        vehicle_id: vehicleId,
      });
    }
  }

  if (links.length > 0) {
    // Scheitert nur die Zuordnung, bleiben die Einträge bestehen — der Beleg
    // liegt weiterhin im Archiv und lässt sich von Hand verknüpfen.
    await supabase.from("service_entry_documents").insert(links);
  }

  const confirmedIds = parsed.data.entries.map((e) => e.id);
  await supabase
    .from("scheckheft_import_drafts")
    .update({ status: "confirmed" })
    .in("id", confirmedIds);

  // Nicht übernommene Entwürfe verfallen mit dem Auftrag
  await supabase
    .from("scheckheft_import_drafts")
    .update({ status: "discarded" })
    .eq("job_id", jobId)
    .eq("status", "open");

  await supabase
    .from("scheckheft_import_jobs")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", jobId);

  return NextResponse.json({ created: created.length });
}
