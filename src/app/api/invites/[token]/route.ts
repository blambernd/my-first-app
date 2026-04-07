import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createClient();

  // Server-side query bypasses the client-side RLS issues
  // The server client still respects RLS, but has a valid session context
  const { data: invitation, error } = await supabase
    .from("vehicle_invitations")
    .select("id, vehicle_id, role, status, expires_at, vehicles(make, model, year)")
    .eq("token", token)
    .single();

  if (error || !invitation) {
    return NextResponse.json({ status: "invalid" }, { status: 404 });
  }

  if (invitation.status === "angenommen") {
    return NextResponse.json({ status: "accepted" });
  }

  if (invitation.status === "widerrufen" || invitation.status === "abgelaufen") {
    return NextResponse.json({ status: "expired" });
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ status: "expired" });
  }

  const vehicle = invitation.vehicles as unknown as { make: string; model: string; year: number } | null;

  return NextResponse.json({
    status: "valid",
    role: invitation.role,
    expiresAt: invitation.expires_at,
    vehicleName: vehicle
      ? `${vehicle.make} ${vehicle.model} (${vehicle.year})`
      : "Fahrzeug",
  });
}
