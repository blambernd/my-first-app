import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Nicht angemeldet" },
      { status: 401 }
    );
  }

  // Find the transfer by token
  const { data: transfer, error: findError } = await supabase
    .from("vehicle_transfers")
    .select("id, status, to_email")
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

  // Verify the declining user's email matches (fail-closed)
  if (!user.email || user.email.toLowerCase() !== transfer.to_email.toLowerCase()) {
    return NextResponse.json(
      { error: "Deine E-Mail-Adresse stimmt nicht mit der Einladung überein" },
      { status: 403 }
    );
  }

  // Update transfer status
  const { error: updateError } = await supabase
    .from("vehicle_transfers")
    .update({ status: "abgelehnt" })
    .eq("id", transfer.id);

  if (updateError) {
    console.error("Transfer decline error:", updateError);
    return NextResponse.json(
      { error: "Fehler beim Ablehnen des Transfers" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
