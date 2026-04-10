import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ transfers: [], invitations: [] });
  }

  const now = new Date().toISOString();

  // Get user's owned vehicle IDs
  const { data: ownedVehicles } = await supabase
    .from("vehicles")
    .select("id")
    .eq("user_id", user.id);
  const ownedIds = new Set((ownedVehicles ?? []).map((v) => v.id));

  // Fetch open transfers (RLS: owner's vehicles + matching email)
  const { data: rawTransfers } = await supabase
    .from("vehicle_transfers")
    .select("id, token, vehicle_id, expires_at, vehicles(make, model)")
    .eq("status", "offen")
    .gt("expires_at", now);

  const transfers = (rawTransfers ?? [])
    .filter((t) => !ownedIds.has(t.vehicle_id))
    .map((t) => {
      const v = t.vehicles as unknown as { make: string; model: string } | null;
      return {
        id: t.id,
        token: t.token,
        vehicle_name: v ? `${v.make} ${v.model}` : "Fahrzeug",
        expires_at: t.expires_at,
      };
    });

  // Fetch open invitations (RLS: owner's vehicles + matching email)
  const { data: rawInvitations } = await supabase
    .from("vehicle_invitations")
    .select("id, token, role, vehicle_id, expires_at, vehicles(make, model)")
    .eq("status", "offen")
    .gt("expires_at", now);

  const invitations = (rawInvitations ?? [])
    .filter((inv) => !ownedIds.has(inv.vehicle_id))
    .map((inv) => {
      const v = inv.vehicles as unknown as { make: string; model: string } | null;
      return {
        id: inv.id,
        token: inv.token,
        role: inv.role,
        vehicle_name: v ? `${v.make} ${v.model}` : "Fahrzeug",
        expires_at: inv.expires_at,
      };
    });

  return NextResponse.json({ transfers, invitations });
}
