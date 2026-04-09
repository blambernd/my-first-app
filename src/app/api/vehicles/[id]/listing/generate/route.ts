import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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

  // Fetch vehicle with all relevant data
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select(
      "make, model, year, factory_code, color, engine_type, displacement_ccm, horsepower, mileage_km"
    )
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  // Fetch service entry count and milestone highlights
  const [serviceResult, milestoneResult, profileResult] = await Promise.all([
    supabase
      .from("service_entries")
      .select("id", { count: "exact", head: true })
      .eq("vehicle_id", vehicleId),
    supabase
      .from("vehicle_milestones")
      .select("title, category")
      .eq("vehicle_id", vehicleId)
      .order("milestone_date", { ascending: false })
      .limit(5),
    supabase
      .from("vehicle_profiles")
      .select("token, is_active")
      .eq("vehicle_id", vehicleId)
      .single(),
  ]);

  const serviceCount = serviceResult.count || 0;
  const milestones = milestoneResult.data || [];
  const profile = profileResult.data;

  // Generate title
  const titleParts = [vehicle.make, vehicle.model];
  if (vehicle.factory_code) titleParts.push(`(${vehicle.factory_code})`);
  titleParts.push("—", `EZ ${vehicle.year}`);
  const title = titleParts.join(" ");

  // Generate description
  const lines: string[] = [];

  // Vehicle overview
  lines.push(
    `Zum Verkauf steht ein ${vehicle.make} ${vehicle.model}${vehicle.factory_code ? ` (${vehicle.factory_code})` : ""}, Erstzulassung ${vehicle.year}.`
  );
  lines.push("");

  // Technical details
  const details: string[] = [];
  if (vehicle.color) details.push(`Farbe: ${vehicle.color}`);
  if (vehicle.engine_type) details.push(`Motor: ${vehicle.engine_type}`);
  if (vehicle.displacement_ccm)
    details.push(
      `Hubraum: ${vehicle.displacement_ccm.toLocaleString("de-DE")} ccm`
    );
  if (vehicle.horsepower) details.push(`Leistung: ${vehicle.horsepower} PS`);
  if (vehicle.mileage_km != null)
    details.push(
      `Laufleistung: ${vehicle.mileage_km.toLocaleString("de-DE")} km`
    );

  if (details.length > 0) {
    lines.push("FAHRZEUGDATEN");
    lines.push(...details);
    lines.push("");
  }

  // Service history
  if (serviceCount > 0) {
    lines.push("WARTUNGSHISTORIE");
    lines.push(
      `Das Fahrzeug verfügt über ein lückenlos gepflegtes Scheckheft mit ${serviceCount} dokumentierten ${serviceCount === 1 ? "Eintrag" : "Einträgen"}.`
    );
    lines.push("");
  }

  // Milestones
  const highlights = milestones.filter(
    (m) =>
      m.category === "restauration" ||
      m.category === "tuev" ||
      m.category === "gutachten"
  );
  if (highlights.length > 0) {
    lines.push("HIGHLIGHTS");
    for (const h of highlights) {
      lines.push(`• ${h.title}`);
    }
    lines.push("");
  }

  // Kurzprofil link
  if (profile?.is_active && profile.token) {
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    lines.push("FAHRZEUGHISTORIE");
    lines.push(
      `Die vollständige, verifizierte Fahrzeughistorie finden Sie hier:`
    );
    lines.push(`${origin}/profil/${profile.token}`);
    lines.push("");
  }

  // Closing
  lines.push("Besichtigung und Probefahrt nach Vereinbarung.");
  lines.push("Bei Fragen stehe ich gerne zur Verfügung.");

  const description = lines.join("\n");

  return NextResponse.json({ title, description });
}
