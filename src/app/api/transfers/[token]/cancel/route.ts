import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  // Find the transfer by token
  const { data: transfer, error: findError } = await supabase
    .from("vehicle_transfers")
    .select("id, status, vehicle_id")
    .eq("token", token)
    .single();

  if (findError || !transfer) {
    return NextResponse.json(
      { error: "Transfer nicht gefunden" },
      { status: 404 }
    );
  }

  if (transfer.status !== "offen") {
    return NextResponse.json(
      { error: "Transfer ist nicht mehr aktiv" },
      { status: 400 }
    );
  }

  // Verify the user owns this vehicle
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", transfer.vehicle_id)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    return NextResponse.json(
      { error: "Nur der Besitzer kann den Transfer abbrechen" },
      { status: 403 }
    );
  }

  const { error: updateError } = await supabase
    .from("vehicle_transfers")
    .update({ status: "abgebrochen" })
    .eq("id", transfer.id);

  if (updateError) {
    console.error("Transfer cancel error:", updateError);
    return NextResponse.json(
      { error: "Fehler beim Abbrechen des Transfers" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
