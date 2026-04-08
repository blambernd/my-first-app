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
    return NextResponse.json(
      { error: "Nicht angemeldet" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase.rpc("accept_vehicle_invitation", {
    p_token: token,
  });

  if (error) {
    console.error("Accept invitation RPC error:", error);
    return NextResponse.json(
      { error: "Fehler beim Annehmen der Einladung" },
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
