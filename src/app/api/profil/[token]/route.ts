import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ProfileConfig } from "@/lib/validations/vehicle-profile";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
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
    return NextResponse.json(
      { error: "Profil nicht gefunden" },
      { status: 404 }
    );
  }

  if (!profile.is_active) {
    return NextResponse.json(
      { error: "Dieses Profil ist nicht mehr verfügbar" },
      { status: 410 }
    );
  }

  const config = profile.config as ProfileConfig;
  const vehicleId = profile.vehicle_id;

  // Fetch vehicle data
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("make, model, year, year_estimated, factory_code, color, engine_type, displacement_ccm, horsepower, mileage_km, body_type")
    .eq("id", vehicleId)
    .single();

  if (!vehicle) {
    return NextResponse.json(
      { error: "Fahrzeug nicht gefunden" },
      { status: 404 }
    );
  }

  // Build response based on config sections
  const result: Record<string, unknown> = {
    vehicle: {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      year_estimated: vehicle.year_estimated,
      factory_code: vehicle.factory_code,
    },
  };

  // Stammdaten
  if (config.sections.stammdaten) {
    result.stammdaten = {
      color: vehicle.color,
      engine_type: vehicle.engine_type,
      displacement_ccm: vehicle.displacement_ccm,
      horsepower: vehicle.horsepower,
      mileage_km: vehicle.mileage_km,
      body_type: vehicle.body_type,
      factory_code: vehicle.factory_code,
    };
  }

  // Fotos
  if (config.sections.fotos) {
    let query = supabase
      .from("vehicle_images")
      .select("id, storage_path, position, is_primary")
      .eq("vehicle_id", vehicleId)
      .order("position");

    if (config.selected_images.length > 0) {
      query = query.in("id", config.selected_images);
    }

    const { data: images } = await query;
    result.fotos = images || [];
  }

  // Scheckheft
  if (config.sections.scheckheft) {
    let query = supabase
      .from("service_entries")
      .select("id, description, service_date, mileage_km, cost_cents, workshop_name, entry_type, notes")
      .eq("vehicle_id", vehicleId)
      .order("service_date", { ascending: false });

    if (config.selected_service_entries.length > 0) {
      query = query.in("id", config.selected_service_entries);
    }

    const { data: entries } = await query;
    result.scheckheft = entries || [];
  }

  // Meilensteine
  if (config.sections.meilensteine) {
    let query = supabase
      .from("vehicle_milestones")
      .select("id, title, description, milestone_date, category, vehicle_milestone_images(id, storage_path, caption)")
      .eq("vehicle_id", vehicleId)
      .order("milestone_date", { ascending: false });

    if (config.selected_milestones.length > 0) {
      query = query.in("id", config.selected_milestones);
    }

    const { data: milestones } = await query;
    result.meilensteine = milestones || [];
  }

  // Dokumente
  if (config.sections.dokumente) {
    let query = supabase
      .from("vehicle_documents")
      .select("id, title, category, document_date, storage_path, mime_type")
      .eq("vehicle_id", vehicleId)
      .order("document_date", { ascending: false });

    if (config.selected_documents.length > 0) {
      query = query.in("id", config.selected_documents);
    }

    const { data: documents } = await query;
    result.dokumente = documents || [];
  }

  return NextResponse.json(result);
}
