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

  const { data, error } = await supabase.rpc("get_pending_requests");

  if (error) {
    console.error("Pending requests RPC error:", error);
    return NextResponse.json({ transfers: [], invitations: [] });
  }

  const result = data as {
    transfers: Array<{ id: string; token: string; vehicle_name: string; expires_at: string }>;
    invitations: Array<{ id: string; token: string; role: string; vehicle_name: string; expires_at: string }>;
  };

  return NextResponse.json({
    transfers: result.transfers ?? [],
    invitations: result.invitations ?? [],
  });
}
