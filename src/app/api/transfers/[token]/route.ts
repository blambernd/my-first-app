import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createClient();

  // Use RPC function (SECURITY DEFINER) to look up transfer by token
  // This avoids the overly permissive USING(TRUE) RLS policy
  const { data, error } = await supabase.rpc("get_transfer_by_token", {
    p_token: token,
  });

  if (error) {
    return NextResponse.json({ status: "invalid" }, { status: 404 });
  }

  const result = data as {
    status: string;
    expiresAt?: string;
    keepAsViewer?: boolean;
    vehicleName?: string;
  };

  return NextResponse.json(result);
}
