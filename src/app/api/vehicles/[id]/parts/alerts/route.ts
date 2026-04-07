import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { z } from "zod";

const createAlertSchema = z.object({
  search_query: z.string().min(2).max(200),
  max_price_cents: z.number().int().min(0).nullable().optional(),
  condition_filter: z.enum(["all", "new", "used"]).default("all"),
  vehicle_make: z.string().min(1),
  vehicle_model: z.string().min(1),
  vehicle_year: z.number().int().min(1886),
});

const updateAlertSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "paused"]).optional(),
  max_price_cents: z.number().int().min(0).nullable().optional(),
  condition_filter: z.enum(["all", "new", "used"]).optional(),
  search_query: z.string().min(2).max(200).optional(),
});

const deleteAlertSchema = z.object({
  id: z.string().uuid(),
});

const MAX_ALERTS_FREE = 5;

async function verifyVehicleAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string,
  userId: string
): Promise<boolean> {
  const { data: ownedVehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("user_id", userId)
    .single();

  if (ownedVehicle) return true;

  const { data: membership } = await supabase
    .from("vehicle_members")
    .select("vehicle_id")
    .eq("vehicle_id", vehicleId)
    .eq("user_id", userId)
    .single();

  return !!membership;
}

// GET: List alerts for a vehicle
export async function GET(
  _request: Request,
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

  const hasAccess = await verifyVehicleAccess(supabase, vehicleId, user.id);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Kein Zugriff auf dieses Fahrzeug" },
      { status: 403 }
    );
  }

  const { data: alerts, error } = await supabase
    .from("part_alerts")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Laden der Alerts" },
      { status: 500 }
    );
  }

  return NextResponse.json({ alerts });
}

// POST: Create a new alert
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

  const hasAccess = await verifyVehicleAccess(supabase, vehicleId, user.id);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Kein Zugriff auf dieses Fahrzeug" },
      { status: 403 }
    );
  }

  // Parse body
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Ungültiger Request-Body" },
      { status: 400 }
    );
  }

  const parsed = createAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check alert limit (free plan: max 5 active alerts total)
  const { count } = await supabase
    .from("part_alerts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  if (count !== null && count >= MAX_ALERTS_FREE) {
    return NextResponse.json(
      {
        error: `Maximale Anzahl aktiver Alerts erreicht (${MAX_ALERTS_FREE}). Deaktiviere einen bestehenden Alert oder wechsle zum Premium-Plan.`,
      },
      { status: 429 }
    );
  }

  // Check for duplicate alert
  const { data: existingAlert } = await supabase
    .from("part_alerts")
    .select("id")
    .eq("vehicle_id", vehicleId)
    .eq("user_id", user.id)
    .eq("search_query", parsed.data.search_query)
    .eq("status", "active")
    .single();

  if (existingAlert) {
    return NextResponse.json(
      { error: "Ein ähnlicher Alert existiert bereits für dieses Fahrzeug." },
      { status: 409 }
    );
  }

  // Insert
  const { data: alert, error } = await supabase
    .from("part_alerts")
    .insert({
      vehicle_id: vehicleId,
      user_id: user.id,
      search_query: parsed.data.search_query,
      max_price_cents: parsed.data.max_price_cents ?? null,
      condition_filter: parsed.data.condition_filter,
      vehicle_make: parsed.data.vehicle_make,
      vehicle_model: parsed.data.vehicle_model,
      vehicle_year: parsed.data.vehicle_year,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Alerts" },
      { status: 500 }
    );
  }

  return NextResponse.json({ alert }, { status: 201 });
}

// PATCH: Update an alert (status, price, condition)
export async function PATCH(
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

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Ungültiger Request-Body" },
      { status: 400 }
    );
  }

  const parsed = updateAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id: alertId, ...updates } = parsed.data;

  // Verify ownership
  const { data: existingAlert } = await supabase
    .from("part_alerts")
    .select("id")
    .eq("id", alertId)
    .eq("vehicle_id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (!existingAlert) {
    return NextResponse.json(
      { error: "Alert nicht gefunden" },
      { status: 404 }
    );
  }

  const { data: alert, error } = await supabase
    .from("part_alerts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", alertId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren" },
      { status: 500 }
    );
  }

  return NextResponse.json({ alert });
}

// DELETE: Delete an alert
export async function DELETE(
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

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Ungültiger Request-Body" },
      { status: 400 }
    );
  }

  const parsed = deleteAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  // Verify ownership
  const { data: existingAlert } = await supabase
    .from("part_alerts")
    .select("id")
    .eq("id", parsed.data.id)
    .eq("vehicle_id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (!existingAlert) {
    return NextResponse.json(
      { error: "Alert nicht gefunden" },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("part_alerts")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Löschen" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
