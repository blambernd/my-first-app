import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getPlzCoordinates, haversineDistance } from "@/lib/geo";

const VALID_CATEGORIES = ["rallye", "messe", "regional"] as const;
const VALID_RADII = [25, 50, 100, 200];
const MAX_RESULTS = 100;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const plz = searchParams.get("plz");
  const radiusParam = searchParams.get("radius");
  const categoriesParam = searchParams.get("categories");

  // Validate PLZ
  if (!plz || !/^\d{5}$/.test(plz)) {
    return NextResponse.json(
      { error: "Ungültige PLZ (5-stellig, numerisch)" },
      { status: 400 }
    );
  }

  // Validate radius
  const radius = radiusParam ? parseInt(radiusParam, 10) : 50;
  if (!VALID_RADII.includes(radius)) {
    return NextResponse.json(
      { error: "Ungültiger Umkreis (25, 50, 100 oder 200 km)" },
      { status: 400 }
    );
  }

  // Parse categories
  const categories = categoriesParam
    ? categoriesParam.split(",").filter((c): c is (typeof VALID_CATEGORIES)[number] =>
        (VALID_CATEGORIES as readonly string[]).includes(c)
      )
    : [...VALID_CATEGORIES];

  if (categories.length === 0) {
    return NextResponse.json(
      { error: "Mindestens eine Kategorie erforderlich" },
      { status: 400 }
    );
  }

  // Get coordinates for the user's PLZ
  const coords = await getPlzCoordinates(plz);
  if (!coords) {
    return NextResponse.json(
      { error: "PLZ nicht gefunden. Bitte überprüfe deine Eingabe." },
      { status: 404 }
    );
  }

  // Calculate bounding box for efficient DB query (rough pre-filter)
  // 1 degree latitude ≈ 111 km, 1 degree longitude ≈ 111 * cos(lat) km
  const latDelta = radius / 111;
  const lngDelta = radius / (111 * Math.cos((coords.lat * Math.PI) / 180));

  // Query events within bounding box, future only
  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, date_start, date_end, location, plz, lat, lng, category, description, entry_price, website_url")
    .gte("date_start", new Date().toISOString().split("T")[0])
    .in("category", categories)
    .gte("lat", coords.lat - latDelta)
    .lte("lat", coords.lat + latDelta)
    .gte("lng", coords.lng - lngDelta)
    .lte("lng", coords.lng + lngDelta)
    .order("date_start", { ascending: true })
    .limit(MAX_RESULTS);

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Laden der Veranstaltungen" },
      { status: 500 }
    );
  }

  // Calculate exact distances using Haversine and filter by radius
  const eventsWithDistance = (events ?? [])
    .map((event) => ({
      id: event.id,
      name: event.name,
      date_start: event.date_start,
      date_end: event.date_end,
      location: event.location,
      plz: event.plz,
      category: event.category,
      description: event.description,
      entry_price: event.entry_price,
      website_url: event.website_url,
      distance_km: haversineDistance(
        coords.lat,
        coords.lng,
        event.lat,
        event.lng
      ),
    }))
    .filter((e) => e.distance_km <= radius)
    .sort((a, b) => {
      // Primary sort: date ascending, secondary: distance ascending
      const dateCompare = a.date_start.localeCompare(b.date_start);
      if (dateCompare !== 0) return dateCompare;
      return a.distance_km - b.distance_km;
    });

  return NextResponse.json({ events: eventsWithDistance });
}
