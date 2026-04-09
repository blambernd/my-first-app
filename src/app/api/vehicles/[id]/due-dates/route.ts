import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { z } from "zod";

const upsertSchema = z.object({
  due_type: z.enum(["tuv_hu", "service", "oil_change", "oil_motor_oil", "oil_transmission_oil", "oil_rear_axle_oil", "oil_other_oil"]),
  due_date: z.string().min(1, "Datum ist erforderlich"),
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

  const { data: dueDates } = await supabase
    .from("vehicle_due_dates")
    .select("*")
    .eq("vehicle_id", vehicleId);

  return NextResponse.json({ dueDates: dueDates || [] });
}

export async function PUT(
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
  const parsed = upsertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Daten", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("vehicle_due_dates")
    .upsert(
      {
        vehicle_id: vehicleId,
        user_id: user.id,
        due_type: parsed.data.due_type,
        due_date: parsed.data.due_date,
        reminder_sent_7d: false,
        reminder_sent_1d: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "vehicle_id,due_type" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Fehler beim Speichern" },
      { status: 500 }
    );
  }

  return NextResponse.json({ dueDate: data });
}
