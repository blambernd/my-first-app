import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { error } = await supabase.from("premium_waitlist").upsert(
    { email: user.email, user_id: user.id },
    { onConflict: "email" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ onWaitlist: false });
  }

  const { data } = await supabase
    .from("premium_waitlist")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ onWaitlist: !!data });
}
