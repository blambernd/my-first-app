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

  // Call the atomic RPC function
  const { data, error } = await supabase.rpc("accept_vehicle_transfer", {
    p_token: token,
  });

  if (error) {
    console.error("Transfer accept RPC error:", error);
    return NextResponse.json(
      { error: "Fehler beim Annehmen des Transfers" },
      { status: 500 }
    );
  }

  const result = data as { error?: string; success?: boolean; vehicleId?: string };

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    vehicleId: result.vehicleId,
  });
}
