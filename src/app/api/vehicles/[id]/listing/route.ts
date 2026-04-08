import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { listingSchema, publishedPlatformSchema } from "@/lib/validations/listing";
import { z } from "zod";

const patchSchema = listingSchema
  .partial()
  .extend({
    published_platforms: z.array(publishedPlatformSchema).optional(),
  });

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

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  const { data: listing } = await supabase
    .from("vehicle_listings")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .single();

  return NextResponse.json({ listing: listing || null });
}

export async function POST(
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

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
  }

  // Check if listing already exists
  const { data: existing } = await supabase
    .from("vehicle_listings")
    .select("id")
    .eq("vehicle_id", vehicleId)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Inserat existiert bereits" },
      { status: 409 }
    );
  }

  const { data: listing, error } = await supabase
    .from("vehicle_listings")
    .insert({
      vehicle_id: vehicleId,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Erstellen" },
      { status: 500 }
    );
  }

  return NextResponse.json({ listing }, { status: 201 });
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
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Daten", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.price_cents !== undefined) updateData.price_cents = parsed.data.price_cents;
  if (parsed.data.price_type !== undefined) updateData.price_type = parsed.data.price_type;
  if (parsed.data.selected_photo_ids !== undefined) updateData.selected_photo_ids = parsed.data.selected_photo_ids;
  if (parsed.data.photo_order !== undefined) updateData.photo_order = parsed.data.photo_order;
  if (parsed.data.published_platforms !== undefined) updateData.published_platforms = parsed.data.published_platforms;
  if (parsed.data.contact_info !== undefined) updateData.contact_info = parsed.data.contact_info;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Keine Daten zum Aktualisieren" }, { status: 400 });
  }

  const { data: listing, error } = await supabase
    .from("vehicle_listings")
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

  return NextResponse.json({ listing });
}
