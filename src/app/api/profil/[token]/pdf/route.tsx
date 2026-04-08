import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ReactPDF from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ProfileConfig } from "@/lib/validations/vehicle-profile";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#666", marginBottom: 16 },
  meta: { fontSize: 9, color: "#999", marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f3f4f6",
    padding: "6 8",
    marginBottom: 8,
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  label: { fontSize: 9, color: "#6b7280", width: 100 },
  value: { fontSize: 10, flex: 1 },
  entry: {
    paddingLeft: 12,
    paddingBottom: 6,
    marginBottom: 4,
    borderLeftWidth: 2,
    borderLeftColor: "#d1d5db",
  },
  entryTitle: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  entryMeta: { fontSize: 8, color: "#6b7280", marginTop: 1 },
  entryDesc: { fontSize: 9, color: "#374151", marginTop: 2 },
  docRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}

interface PdfData {
  vehicle: { make: string; model: string; year: number; factory_code: string | null };
  stammdaten?: Record<string, unknown>;
  scheckheft?: { description: string; service_date: string; entry_type: string; notes: string | null; mileage_km: number | null; cost_cents: number | null; workshop_name: string | null }[];
  meilensteine?: { title: string; milestone_date: string; description: string | null; category: string | null }[];
  dokumente?: { title: string; category: string | null; document_date: string | null }[];
}

const STAMMDATEN_LABELS: Record<string, string> = {
  color: "Farbe",
  engine_type: "Motortyp",
  displacement_ccm: "Hubraum",
  horsepower: "Leistung",
  mileage_km: "Laufleistung",
  body_type: "Karosserie",
  factory_code: "Werksbezeichnung",
};

function formatStammdatenValue(key: string, value: unknown): string {
  if (value == null) return "";
  if (key === "displacement_ccm") return `${Number(value).toLocaleString("de-DE")} ccm`;
  if (key === "horsepower") return `${value} PS`;
  if (key === "mileage_km") return `${Number(value).toLocaleString("de-DE")} km`;
  return String(value);
}

function ProfilePdfDocument({ data }: { data: PdfData }) {
  const { vehicle } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {vehicle.make} {vehicle.model}
            {vehicle.factory_code ? ` (${vehicle.factory_code})` : ""}
          </Text>
          <Text style={styles.subtitle}>Baujahr {vehicle.year}</Text>
          <Text style={styles.meta}>
            Fahrzeugprofil — Erstellt am{" "}
            {new Date().toLocaleDateString("de-DE")}
          </Text>
        </View>

        {data.stammdaten && (
          <View>
            <Text style={styles.sectionTitle}>Fahrzeugdaten</Text>
            {Object.entries(STAMMDATEN_LABELS).map(([key, label]) => {
              const val = (data.stammdaten as Record<string, unknown>)[key];
              if (val == null) return null;
              return (
                <View key={key} style={styles.row}>
                  <Text style={styles.label}>{label}</Text>
                  <Text style={styles.value}>
                    {formatStammdatenValue(key, val)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {data.scheckheft && data.scheckheft.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>
              Scheckheft ({data.scheckheft.length}{" "}
              {data.scheckheft.length === 1 ? "Eintrag" : "Einträge"})
            </Text>
            {data.scheckheft.map((entry, i) => (
              <View key={i} style={styles.entry}>
                <Text style={styles.entryTitle}>{entry.description}</Text>
                <Text style={styles.entryMeta}>
                  {formatDate(entry.service_date)}
                  {entry.workshop_name ? ` — ${entry.workshop_name}` : ""}
                  {entry.mileage_km
                    ? ` — ${entry.mileage_km.toLocaleString("de-DE")} km`
                    : ""}
                  {entry.cost_cents
                    ? ` — ${formatCents(entry.cost_cents)}`
                    : ""}
                </Text>
                {entry.notes && (
                  <Text style={styles.entryDesc}>{entry.notes}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {data.meilensteine && data.meilensteine.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>
              Meilensteine & Restaurierungen
            </Text>
            {data.meilensteine.map((m, i) => (
              <View key={i} style={styles.entry}>
                <Text style={styles.entryTitle}>{m.title}</Text>
                <Text style={styles.entryMeta}>
                  {formatDate(m.milestone_date)}
                  {m.category ? ` — ${m.category}` : ""}
                </Text>
                {m.description && (
                  <Text style={styles.entryDesc}>{m.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {data.dokumente && data.dokumente.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Dokumente</Text>
            {data.dokumente.map((doc, i) => (
              <View key={i} style={styles.docRow}>
                <Text style={styles.value}>{doc.title}</Text>
                <Text style={styles.entryMeta}>
                  {doc.category ? `${doc.category}` : ""}
                  {doc.document_date ? ` — ${formatDate(doc.document_date)}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>Erstellt mit Oldtimer Docs</Text>

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
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createServiceClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Server-Konfigurationsfehler" },
      { status: 503 }
    );
  }

  // Fetch profile by token
  const { data: profile } = await supabase
    .from("vehicle_profiles")
    .select("*")
    .eq("token", token)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 });
  }

  if (!profile.is_active) {
    return NextResponse.json(
      { error: "Dieses Profil ist nicht mehr verfügbar" },
      { status: 410 }
    );
  }

  const config = profile.config as ProfileConfig;
  const vehicleId = profile.vehicle_id;

  // Fetch vehicle
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("make, model, year, factory_code, color, engine_type, displacement_ccm, horsepower, mileage_km, body_type")
    .eq("id", vehicleId)
    .single();

  if (!vehicle) {
    return NextResponse.json({ error: "Fahrzeug nicht gefunden" }, { status: 404 });
  }

  // Build PDF data based on config (same logic as the public JSON API)
  const pdfData: PdfData = {
    vehicle: {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      factory_code: vehicle.factory_code,
    },
  };

  if (config.sections.stammdaten) {
    pdfData.stammdaten = {
      color: vehicle.color,
      engine_type: vehicle.engine_type,
      displacement_ccm: vehicle.displacement_ccm,
      horsepower: vehicle.horsepower,
      mileage_km: vehicle.mileage_km,
      body_type: vehicle.body_type,
      factory_code: vehicle.factory_code,
    };
  }

  if (config.sections.scheckheft) {
    let query = supabase
      .from("service_entries")
      .select("description, service_date, mileage_km, cost_cents, workshop_name, entry_type, notes")
      .eq("vehicle_id", vehicleId)
      .order("service_date", { ascending: false });

    if (config.selected_service_entries.length > 0) {
      query = query.in("id", config.selected_service_entries);
    }

    const { data } = await query;
    pdfData.scheckheft = data || [];
  }

  if (config.sections.meilensteine) {
    let query = supabase
      .from("vehicle_milestones")
      .select("title, description, milestone_date, category")
      .eq("vehicle_id", vehicleId)
      .order("milestone_date", { ascending: false });

    if (config.selected_milestones.length > 0) {
      query = query.in("id", config.selected_milestones);
    }

    const { data } = await query;
    pdfData.meilensteine = data || [];
  }

  if (config.sections.dokumente) {
    let query = supabase
      .from("vehicle_documents")
      .select("title, category, document_date")
      .eq("vehicle_id", vehicleId)
      .order("document_date", { ascending: false });

    if (config.selected_documents.length > 0) {
      query = query.in("id", config.selected_documents);
    }

    const { data } = await query;
    pdfData.dokumente = data || [];
  }

  // Generate PDF
  const pdfStream = await ReactPDF.renderToStream(
    <ProfilePdfDocument data={pdfData} />
  );

  const reader = pdfStream as unknown as AsyncIterable<Uint8Array>;
  const chunks: Uint8Array[] = [];
  for await (const chunk of reader) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const fileName = `${vehicle.make}_${vehicle.model}_Kurzprofil.pdf`.replace(
    /\s+/g,
    "_"
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
