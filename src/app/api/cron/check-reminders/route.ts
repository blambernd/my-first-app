import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { ServiceReminderEmail } from "@/emails/service-reminder";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service client not configured" },
      { status: 503 }
    );
  }

  const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

  const now = new Date();
  const in1Day = new Date(now);
  in1Day.setDate(in1Day.getDate() + 1);
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const today = formatDate(now);
  const tomorrow = formatDate(in1Day);
  const oneWeek = formatDate(in7Days);

  // Fetch due dates that need 7-day or 1-day reminders
  const { data: dueDates, error: fetchError } = await supabase
    .from("vehicle_due_dates")
    .select("*, vehicles(make, model, year, user_id)")
    .or(
      `and(due_date.eq.${oneWeek},reminder_sent_7d.eq.false),and(due_date.eq.${tomorrow},reminder_sent_1d.eq.false)`
    );

  if (fetchError || !dueDates) {
    return NextResponse.json(
      { error: "Failed to fetch due dates", details: fetchError?.message },
      { status: 500 }
    );
  }

  let notificationsSent = 0;
  let emailsSent = 0;

  for (const dueDate of dueDates) {
    const vehicle = dueDate.vehicles as {
      make: string;
      model: string;
      year: number;
      user_id: string;
    } | null;
    if (!vehicle) continue;

    const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
    const typeLabel = dueDate.due_type === "tuv_hu" ? "TÜV/HU" : "Service";
    const dueDateFormatted = new Date(dueDate.due_date).toLocaleDateString("de-DE");

    const is7Day = dueDate.due_date === oneWeek && !dueDate.reminder_sent_7d;
    const is1Day = dueDate.due_date === tomorrow && !dueDate.reminder_sent_1d;
    const daysRemaining = is1Day ? 1 : 7;

    // Create in-app notification
    await supabase.from("notifications").insert({
      user_id: vehicle.user_id,
      type: "service_reminder",
      reference_id: dueDate.vehicle_id,
      message: `${typeLabel} für ${vehicleName} ${is1Day ? "morgen" : "in 7 Tagen"} fällig (${dueDateFormatted})`,
    });
    notificationsSent++;

    // Send email
    if (resend) {
      const { data: userData } = await supabase.auth.admin.getUserById(
        vehicle.user_id
      );
      const userEmail = userData?.user?.email;

      if (userEmail) {
        try {
          await resend.emails.send({
            from: "Oldtimer-Scheckheft <noreply@resend.dev>",
            to: userEmail,
            subject: `${typeLabel} für ${vehicleName} ${is1Day ? "morgen" : "in 7 Tagen"} fällig`,
            react: ServiceReminderEmail({
              vehicleName,
              dueType: dueDate.due_type,
              dueDate: dueDateFormatted,
              daysRemaining,
            }),
          });
          emailsSent++;
        } catch {
          // Email sending failed, continue
        }
      }
    }

    // Update reminder flags
    const updateData: Record<string, unknown> = {};
    if (is7Day) updateData.reminder_sent_7d = true;
    if (is1Day) updateData.reminder_sent_1d = true;

    await supabase
      .from("vehicle_due_dates")
      .update(updateData)
      .eq("id", dueDate.id);
  }

  return NextResponse.json({
    success: true,
    dueDatesChecked: dueDates.length,
    notificationsSent,
    emailsSent,
  });
}
