import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { nanoid } from "nanoid";
import { profileConfigSchema } from "@/lib/validations/vehicle-profile";

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

  // Verify ownership
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const { data: profile } = await supabase
    .from("vehicle_profiles")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .single();

  return NextResponse.json({ profile: profile || null });
}

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

  // Verify ownership
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  // Check if profile already exists
  const { data: existing } = await supabase
    .from("vehicle_profiles")
    .select("id")
    .eq("vehicle_id", vehicleId)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Profil existiert bereits" },
      { status: 409 }
    );
  }

  const token = nanoid(12);

  const { data: profile, error } = await supabase
    .from("vehicle_profiles")
    .insert({
      vehicle_id: vehicleId,
      user_id: user.id,
      token,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Profils" },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile }, { status: 201 });
}

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

  // Verify ownership
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  // Update config if provided
  if (body.config !== undefined) {
    const parsed = profileConfigSchema.safeParse(body.config);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Konfiguration", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    updateData.config = parsed.data;
  }

  // Update is_active if provided
  if (typeof body.is_active === "boolean") {
    updateData.is_active = body.is_active;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Keine Änderungen angegeben" },
      { status: 400 }
    );
  }

  const { data: profile, error } = await supabase
    .from("vehicle_profiles")
    .update(updateData)
    .eq("vehicle_id", vehicleId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren" },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile });
}
