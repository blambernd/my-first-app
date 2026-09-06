import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  const { id: vehicleId, jobId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { data: owned } = await supabase
    .from("vehicles")
    .select("id")
    .eq("id", vehicleId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!owned) {
    const { data: membership } = await supabase
      .from("vehicle_members")
      .select("role")
      .eq("vehicle_id", vehicleId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership || !["besitzer", "werkstatt"].includes(membership.role)) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }
  }

  const { data: job } = await supabase
    .from("scheckheft_import_jobs")
    .select("id")
    .eq("id", jobId)
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (!job) {
    return NextResponse.json({ error: "Auftrag nicht gefunden" }, { status: 404 });
  }

  // Entwürfe verwerfen und den Auftrag schliessen. Die hochgeladenen Seiten
  // bleiben als Beleg im Dokumenten-Archiv — sie sind aufbewahrenswert, auch
  // wenn kein Eintrag daraus entstanden ist.
  await supabase
    .from("scheckheft_import_drafts")
    .update({ status: "discarded" })
    .eq("job_id", jobId)
    .eq("status", "open");

  await supabase
    .from("scheckheft_import_jobs")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", jobId);

  return NextResponse.json({ ok: true });
}
