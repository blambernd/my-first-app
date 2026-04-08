import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  searchMarketListings,
  calculatePriceStatistics,
} from "@/lib/market-analysis";
import type { MarketSearchParams } from "@/lib/market-analysis";

const MAX_ANALYSES_PER_DAY = 5;

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Verify the user has access to a vehicle (as owner or member).
 * Returns the vehicle data if authorized, null otherwise.
 */
async function getAuthorizedVehicle(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string,
  userId: string
) {
  const { data: ownedVehicle } = await supabase
    .from("vehicles")
    .select("id, make, model, year, factory_code, mileage_km, user_id")
    .eq("id", vehicleId)
    .eq("user_id", userId)
    .single();

  if (ownedVehicle) return ownedVehicle;

  const { data: membership } = await supabase
    .from("vehicle_members")
    .select("vehicle_id, vehicles(id, make, model, year, factory_code, mileage_km, user_id)")
    .eq("vehicle_id", vehicleId)
    .eq("user_id", userId)
    .single();

  if (membership?.vehicles) {
    return membership.vehicles as unknown as typeof ownedVehicle;
  }

  return null;
}

/**
 * GET /api/vehicles/[id]/market-analysis
 * Fetch analysis history for a vehicle.
 */
export async function GET(request: Request, { params }: RouteContext) {
  const { id: vehicleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const vehicle = await getAuthorizedVehicle(supabase, vehicleId, user.id);
  if (!vehicle) {
    return NextResponse.json(
      { error: "Kein Zugriff auf dieses Fahrzeug" },
      { status: 403 }
    );
  }

  const { data: analyses, error } = await supabase
    .from("market_analyses")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Laden der Analysen" },
      { status: 500 }
    );
  }

  return NextResponse.json({ analyses: analyses || [] });
}

/**
 * POST /api/vehicles/[id]/market-analysis
 * Trigger a new market analysis.
 */
export async function POST(request: Request, { params }: RouteContext) {
  const { id: vehicleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  // Only vehicle owner can trigger analyses
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, make, model, year, factory_code, body_type, mileage_km")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    return NextResponse.json(
      { error: "Nur der Fahrzeugbesitzer kann eine Marktanalyse starten" },
      { status: 403 }
    );
  }

  // Check SERPAPI_API_KEY
  if (!process.env.SERPAPI_API_KEY) {
    return NextResponse.json(
      { error: "Such-Service nicht konfiguriert. SERPAPI_API_KEY fehlt." },
      { status: 503 }
    );
  }

  // Rate limiting: max 5 per vehicle per day (DB-backed)
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("market_analyses")
    .select("id", { count: "exact", head: true })
    .eq("vehicle_id", vehicleId)
    .gte("created_at", dayStart.toISOString());

  if ((count ?? 0) >= MAX_ANALYSES_PER_DAY) {
    return NextResponse.json(
      { error: "Tageslimit erreicht (max. 5 Analysen pro Fahrzeug pro Tag)." },
      { status: 429 }
    );
  }

  // Build search params
  const searchParams: MarketSearchParams = {
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    factoryCode: vehicle.factory_code,
    bodyType: vehicle.body_type,
    mileageKm: vehicle.mileage_km,
  };

  // Search all platforms
  const { listings, platformErrors } = await searchMarketListings(searchParams);

  // Calculate statistics
  const stats = calculatePriceStatistics(listings);

  // Determine status
  const status = stats ? "completed" : "insufficient_data";

  // Build the analysis record
  const analysisRecord = {
    vehicle_id: vehicleId,
    user_id: user.id,
    search_params: {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      factory_code: vehicle.factory_code,
      mileage_km: vehicle.mileage_km,
    },
    status,
    average_price: stats?.average ?? null,
    median_price: stats?.median ?? null,
    lowest_price: stats?.lowest ?? null,
    highest_price: stats?.highest ?? null,
    listing_count: stats?.count ?? listings.filter((l) => l.price !== null).length,
    recommended_price_low: stats?.recommendedLow ?? null,
    recommended_price_high: stats?.recommendedHigh ?? null,
    recommendation_reasoning: stats?.reasoning ?? null,
    listings: stats
      ? stats.listingsWithOutliers.map((l) => ({
          title: l.title,
          price: l.price,
          platform: l.platform,
          url: l.url,
          is_outlier: l.is_outlier,
        }))
      : listings.map((l) => ({
          title: l.title,
          price: l.price,
          platform: l.platform,
          url: l.url,
          is_outlier: false,
        })),
    error_message:
      platformErrors.length > 0
        ? platformErrors.map((e) => `${e.platform}: ${e.error}`).join("; ")
        : null,
  };

  // Save to database
  const { data: analysis, error } = await supabase
    .from("market_analyses")
    .insert(analysisRecord)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Speichern der Analyse" },
      { status: 500 }
    );
  }

  return NextResponse.json({ analysis }, { status: 201 });
}
