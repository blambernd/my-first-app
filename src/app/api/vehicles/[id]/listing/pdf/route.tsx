import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import ReactPDF from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import { PRICE_TYPE_LABELS, type PriceType } from "@/lib/validations/listing";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  price: { fontSize: 14, fontWeight: "bold", marginBottom: 16, color: "#1a1a1a" },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    color: "#666",
    marginBottom: 6,
    borderBottom: "1 solid #eee",
    paddingBottom: 3,
  },
  description: { fontSize: 10, lineHeight: 1.5, whiteSpace: "pre-wrap" as const },
  photoGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 6, marginTop: 10 },
  photo: { width: "48%", height: 140, objectFit: "contain" as const, borderRadius: 4, backgroundColor: "#f5f5f5" },
  photoSingle: { width: "100%", height: 240, objectFit: "contain" as const, borderRadius: 4, marginBottom: 8, backgroundColor: "#f5f5f5" },
  factRow: { flexDirection: "row" as const, marginBottom: 3 },
  factLabel: { fontSize: 9, color: "#888", width: 90 },
  factValue: { fontSize: 10, fontWeight: "bold" },
  profileSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 6,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
  },
  qrCode: { width: 80, height: 80 },
  profileText: { flex: 1 },
  profileTitle: { fontSize: 10, fontWeight: "bold", marginBottom: 3 },
  profileUrl: { fontSize: 8, color: "#666" },
  footer: {
    position: "absolute" as const,
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center" as const,
    fontSize: 7,
    color: "#aaa",
  },
});

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

interface ListingPdfData {
  title: string;
  description: string;
  priceCents: number | null;
  priceType: PriceType;
  photos: string[];
  vehicle: {
    make: string;
    model: string;
    year: number;
    color: string | null;
    engine_type: string | null;
    displacement_ccm: number | null;
    horsepower: number | null;
    mileage_km: number | null;
  };
  contactInfo: { name: string; email: string; phone: string; location: string } | null;
  profileUrl: string | null;
  qrCodeDataUrl: string | null;
}

function ListingPdfDocument({ data }: { data: ListingPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Hero photo */}
        {data.photos.length > 0 && (
          <Image src={data.photos[0]} style={styles.photoSingle} />
        )}

        {/* Additional photos below hero */}
        {data.photos.length > 1 && (
          <View style={styles.photoGrid}>
            {data.photos.slice(1, 5).map((url, i) => (
              <Image key={i} src={url} style={styles.photo} />
            ))}
          </View>
        )}

        {/* Title & Price */}
        <Text style={styles.title}>{data.title}</Text>
        <Text style={styles.price}>
          {data.priceCents
            ? `${formatPrice(data.priceCents)} — ${PRICE_TYPE_LABELS[data.priceType]}`
            : "Preis auf Anfrage"}
        </Text>

        {/* Vehicle facts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fahrzeugdaten</Text>
          {[
            { label: "Baujahr", value: String(data.vehicle.year) },
            data.vehicle.color ? { label: "Farbe", value: data.vehicle.color } : null,
            data.vehicle.engine_type ? { label: "Motor", value: data.vehicle.engine_type } : null,
            data.vehicle.displacement_ccm
              ? { label: "Hubraum", value: `${data.vehicle.displacement_ccm.toLocaleString("de-DE")} ccm` }
              : null,
            data.vehicle.horsepower
              ? { label: "Leistung", value: `${data.vehicle.horsepower} PS` }
              : null,
            data.vehicle.mileage_km != null
              ? { label: "Laufleistung", value: `${data.vehicle.mileage_km.toLocaleString("de-DE")} km` }
              : null,
          ]
            .filter(Boolean)
            .map((fact, i) => (
              <View key={i} style={styles.factRow}>
                <Text style={styles.factLabel}>{fact!.label}</Text>
                <Text style={styles.factValue}>{fact!.value}</Text>
              </View>
            ))}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Beschreibung</Text>
          <Text style={styles.description}>{data.description}</Text>
        </View>

        {/* Contact info */}
        {data.contactInfo && (data.contactInfo.name || data.contactInfo.email || data.contactInfo.phone || data.contactInfo.location) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kontakt</Text>
            {[
              data.contactInfo.name ? { label: "Name", value: data.contactInfo.name } : null,
              data.contactInfo.phone ? { label: "Telefon", value: data.contactInfo.phone } : null,
              data.contactInfo.email ? { label: "E-Mail", value: data.contactInfo.email } : null,
              data.contactInfo.location ? { label: "Standort", value: data.contactInfo.location } : null,
            ]
              .filter(Boolean)
              .map((item, i) => (
                <View key={i} style={styles.factRow}>
                  <Text style={styles.factLabel}>{item!.label}</Text>
                  <Text style={styles.factValue}>{item!.value}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Kurzprofil with QR Code */}
        {data.profileUrl && data.qrCodeDataUrl && (
          <View style={styles.profileSection}>
            <Image src={data.qrCodeDataUrl} style={styles.qrCode} />
            <View style={styles.profileText}>
              <Text style={styles.profileTitle}>
                Vollständige Fahrzeughistorie
              </Text>
              <Text style={styles.profileUrl}>{data.profileUrl}</Text>
            </View>
          </View>
        )}

        <Text style={styles.footer}>Erstellt mit Oldtimer Docs</Text>
      </Page>

      {/* Additional photos page for remaining photos beyond the first 5 */}
      {data.photos.length > 5 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Weitere Fotos</Text>
          <View style={styles.photoGrid}>
            {data.photos.slice(5).map((url, i) => (
              <Image key={i} src={url} style={styles.photo} />
            ))}
          </View>
          <Text style={styles.footer}>Erstellt mit Oldtimer Docs</Text>
        </Page>
      )}
    </Document>
  );
}

export async function GET(
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

  // Verify ownership
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select(
      "id, make, model, year, color, engine_type, displacement_ccm, horsepower, mileage_km"
    )
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  // Fetch listing
  const { data: listing } = await supabase
    .from("vehicle_listings")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .single();

  if (!listing) {
    return NextResponse.json(
      { error: "Kein Inserat vorhanden" },
      { status: 404 }
    );
  }

  // Fetch profile for QR code
  const { data: profile } = await supabase
    .from("vehicle_profiles")
    .select("token, is_active")
    .eq("vehicle_id", vehicleId)
    .single();

  // Get photo URLs
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  const selectedIds: string[] = listing.selected_photo_ids || [];
  const photoOrder: string[] = listing.photo_order || [];

  let photoUrls: string[] = [];
  if (selectedIds.length > 0) {
    const [imgResult, milestoneImgResult] = await Promise.all([
      supabase
        .from("vehicle_images")
        .select("id, storage_path")
        .in("id", selectedIds),
      supabase
        .from("vehicle_milestone_images")
        .select("id, storage_path")
        .in("id", selectedIds),
    ]);

    const allPhotos = [
      ...(imgResult.data || []).map((p) => ({
        id: p.id,
        url: `${supabaseUrl}/storage/v1/object/public/vehicle-images/${p.storage_path}`,
      })),
      ...(milestoneImgResult.data || []).map((p) => ({
        id: p.id,
        url: `${supabaseUrl}/storage/v1/object/public/vehicle-images/${p.storage_path}`,
      })),
    ];

    // Sort by photo_order
    if (photoOrder.length > 0) {
      allPhotos.sort(
        (a, b) => photoOrder.indexOf(a.id) - photoOrder.indexOf(b.id)
      );
    }
    photoUrls = allPhotos.map((p) => p.url);
  }

  // Generate QR code
  let profileUrl: string | null = null;
  let qrCodeDataUrl: string | null = null;
  if (profile?.is_active && profile.token) {
    profileUrl = `${appUrl}/profil/${profile.token}`;
    qrCodeDataUrl = await QRCode.toDataURL(profileUrl, {
      width: 200,
      margin: 1,
      color: { dark: "#000000", light: "#f8f8f8" },
    });
  }

  const pdfData: ListingPdfData = {
    title: listing.title,
    description: listing.description,
    priceCents: listing.price_cents,
    priceType: listing.price_type,
    photos: photoUrls,
    vehicle: {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      engine_type: vehicle.engine_type,
      displacement_ccm: vehicle.displacement_ccm,
      horsepower: vehicle.horsepower,
      mileage_km: vehicle.mileage_km,
    },
    contactInfo: listing.contact_info || null,
    profileUrl,
    qrCodeDataUrl,
  };

  const pdfStream = await ReactPDF.renderToStream(
    <ListingPdfDocument data={pdfData} />
  );

  const reader = pdfStream as unknown as AsyncIterable<Uint8Array>;
  const chunks: Uint8Array[] = [];
  for await (const chunk of reader) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const fileName = `Inserat_${vehicle.make}_${vehicle.model}_${vehicle.year}.pdf`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
