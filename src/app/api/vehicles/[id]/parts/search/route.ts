import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { searchParts } from "@/lib/parts-search";
import { z } from "zod";

const searchQuerySchema = z.object({
  query: z.string().min(2).max(200),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1886),
  condition: z.enum(["all", "new", "used"]).default("all"),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  platforms: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: vehicleId } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  // Verify vehicle access (owner or member)
  const { data: ownedVehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (!ownedVehicle) {
    const { data: membership } = await supabase
      .from("vehicle_members")
      .select("vehicle_id")
      .eq("vehicle_id", vehicleId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Kein Zugriff auf dieses Fahrzeug" },
        { status: 403 }
      );
    }
  }

  // Parse and validate query params
  const url = new URL(request.url);
  const rawParams: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    rawParams[key] = value;
  }

  const parsed = searchQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Suchparameter", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { query, make, model, year, condition, minPrice, maxPrice, platforms, page } =
    parsed.data;

  // Check SERPAPI_API_KEY
  if (!process.env.SERPAPI_API_KEY) {
    return NextResponse.json(
      { error: "Such-Service nicht konfiguriert. SERPAPI_API_KEY fehlt." },
      { status: 503 }
    );
  }

  // Parse platform filter
  const platformIds = platforms
    ? platforms.split(",").filter(Boolean)
    : undefined;

  // Execute search
  const result = await searchParts(
    { query, make, model, year, condition, minPrice, maxPrice },
    platformIds,
    page
  );

  return NextResponse.json(result);
}
