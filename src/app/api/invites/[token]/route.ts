import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createClient();

  // Use RPC (SECURITY DEFINER) to bypass RLS issues
  const { data, error } = await supabase.rpc("get_invitation_by_token", {
    p_token: token,
  });

  if (error) {
    return NextResponse.json({ status: "invalid" }, { status: 404 });
  }

  const result = data as {
    status: string;
    role?: string;
    expiresAt?: string;
    vehicleName?: string;
  };

  return NextResponse.json(result);
}
