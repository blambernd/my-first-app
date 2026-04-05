import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import ReactPDF from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { getEntryTypeLabel, formatCentsToEur } from "@/lib/validations/service-entry";
import { getCategoryLabel, formatFileSize } from "@/lib/validations/vehicle-document";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#666", marginBottom: 16 },
  meta: { fontSize: 9, color: "#999", marginBottom: 20 },
  dateGroup: { marginBottom: 12 },
  dateHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f3f4f6",
    padding: "4 8",
    marginBottom: 6,
  },
  entry: {
    paddingLeft: 12,
    paddingBottom: 6,
    marginBottom: 4,
    borderLeftWidth: 2,
    borderLeftColor: "#d1d5db",
  },
  entryTitle: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  entryType: { fontSize: 8, color: "#6b7280", marginBottom: 2 },
  entryDesc: { fontSize: 9, color: "#374151", marginTop: 2 },
  entryMeta: { fontSize: 8, color: "#9ca3af", marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
});

interface TimelinePdfEntry {
  date: string;
  sourceType: string;
  title: string;
  description: string | null;
  entryType?: string;
  mileageKm?: number;
  costCents?: number | null;
  workshopName?: string | null;
  documentCategory?: string;
  fileName?: string;
  fileSize?: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function sourceLabel(type: string): string {
  switch (type) {
    case "service": return "Scheckheft";
    case "document": return "Dokument";
    case "milestone": return "Meilenstein";
    default: return type;
  }
}

function TimelinePdfDocument({
  vehicleName,
  vehicleYear,
  entries,
  dateRange,
}: {
  vehicleName: string;
  vehicleYear: number;
  entries: TimelinePdfEntry[];
  dateRange: string;
}) {
  // Group by date
  const groups = new Map<string, TimelinePdfEntry[]>();
  for (const entry of entries) {
    const existing = groups.get(entry.date);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(entry.date, [entry]);
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{vehicleName}</Text>
          <Text style={styles.subtitle}>
            Baujahr {vehicleYear} — Fahrzeug-Timeline
          </Text>
          <Text style={styles.meta}>
            {entries.length} Einträge{dateRange ? ` · ${dateRange}` : ""} · Erstellt am{" "}
            {new Date().toLocaleDateString("de-DE")}
          </Text>
        </View>

        {Array.from(groups.entries()).map(([date, groupEntries]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeading}>{formatDate(date)}</Text>
            {groupEntries.map((entry, i) => (
              <View key={`${date}-${i}`} style={styles.entry}>
                <Text style={styles.entryType}>{sourceLabel(entry.sourceType)}</Text>
                <Text style={styles.entryTitle}>
                  {entry.entryType ? `${getEntryTypeLabel(entry.entryType as "inspection")}: ` : ""}
                  {entry.documentCategory
                    ? `${getCategoryLabel(entry.documentCategory as "rechnung")}: `
                    : ""}
                  {entry.title}
                </Text>
                {entry.description && (
                  <Text style={styles.entryDesc}>{entry.description}</Text>
                )}
                <Text style={styles.entryMeta}>
                  {[
                    entry.mileageKm !== undefined
                      ? `${entry.mileageKm.toLocaleString("de-DE")} km`
                      : null,
                    entry.costCents
                      ? formatCentsToEur(entry.costCents)
                      : null,
                    entry.workshopName,
                    entry.fileName
                      ? `${entry.fileName} (${formatFileSize(entry.fileSize ?? 0)})`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Seite ${pageNumber} von ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  // Fetch vehicle (authorization via RLS)
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("make, model, year")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    return NextResponse.json({ error: "Fahrzeug nicht gefunden" }, { status: 404 });
  }

  // Parse date range from query params
  const searchParams = request.nextUrl.searchParams;
  const dateFrom = searchParams.get("from") ?? "";
  const dateTo = searchParams.get("to") ?? "";

  // Fetch all three sources
  const [serviceResult, docResult, milestoneResult] = await Promise.all([
    supabase
      .from("service_entries")
      .select("*")
      .eq("vehicle_id", id)
      .order("service_date", { ascending: false })
      .limit(500),
    supabase
      .from("vehicle_documents")
      .select("*")
      .eq("vehicle_id", id)
      .order("document_date", { ascending: false })
      .limit(500),
    supabase
      .from("vehicle_milestones")
      .select("*")
      .eq("vehicle_id", id)
      .order("milestone_date", { ascending: false })
      .limit(500),
  ]);

  // Build timeline entries
  const entries: TimelinePdfEntry[] = [];

  for (const e of serviceResult.data ?? []) {
    entries.push({
      date: e.service_date,
      sourceType: "service",
      title: e.description,
      description: e.notes,
      entryType: e.entry_type,
      mileageKm: e.mileage_km,
      costCents: e.cost_cents,
      workshopName: e.workshop_name,
    });
  }

  for (const d of docResult.data ?? []) {
    entries.push({
      date: d.document_date,
      sourceType: "document",
      title: d.title,
      description: d.description,
      documentCategory: d.category,
      fileName: d.file_name,
      fileSize: d.file_size,
    });
  }

  for (const m of milestoneResult.data ?? []) {
    entries.push({
      date: m.milestone_date,
      sourceType: "milestone",
      title: m.title,
      description: m.description,
    });
  }

  // Filter by date range
  let filtered = entries;
  if (dateFrom) filtered = filtered.filter((e) => e.date >= dateFrom);
  if (dateTo) filtered = filtered.filter((e) => e.date <= dateTo);

  // Sort descending
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  // Build date range label
  let dateRange = "";
  if (dateFrom && dateTo) {
    dateRange = `${formatDate(dateFrom)} — ${formatDate(dateTo)}`;
  } else if (dateFrom) {
    dateRange = `Ab ${formatDate(dateFrom)}`;
  } else if (dateTo) {
    dateRange = `Bis ${formatDate(dateTo)}`;
  }

  // Generate PDF
  const pdfStream = await ReactPDF.renderToStream(
    <TimelinePdfDocument
      vehicleName={`${vehicle.make} ${vehicle.model}`}
      vehicleYear={vehicle.year}
      entries={filtered}
      dateRange={dateRange}
    />
  );

  // Convert Node stream to Web ReadableStream
  const reader = pdfStream as unknown as AsyncIterable<Uint8Array>;
  const chunks: Uint8Array[] = [];
  for await (const chunk of reader) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const fileName = `${vehicle.make}_${vehicle.model}_Timeline.pdf`.replace(/\s+/g, "_");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
