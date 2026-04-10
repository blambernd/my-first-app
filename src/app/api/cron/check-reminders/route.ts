import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import webpush from "web-push";
import { ServiceReminderEmail } from "@/emails/service-reminder";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function GET(request: Request) {
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

  // Configure VAPID for Web Push
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (vapidPublic && vapidPrivate) {
    webpush.setVapidDetails(
      "mailto:noreply@oldtimer-docs.com",
      vapidPublic,
      vapidPrivate
    );
  }

  const now = new Date();
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const addDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return formatDate(d);
  };

  const tomorrow = addDays(1);
  const in7Days = addDays(7);
  const in14Days = addDays(14);
  const in30Days = addDays(30);

  // Fetch due dates for all possible reminder windows (1, 7, 14, 30 days)
  const { data: dueDates, error: fetchError } = await supabase
    .from("vehicle_due_dates")
    .select("*, vehicles(make, model, year, user_id)")
    .or(
      [
        `and(due_date.eq.${tomorrow},reminder_sent_1d.eq.false)`,
        `and(due_date.eq.${in7Days},reminder_sent_7d.eq.false)`,
        `and(due_date.eq.${in14Days},reminder_sent_14d.eq.false)`,
        `and(due_date.eq.${in30Days},reminder_sent_30d.eq.false)`,
      ].join(",")
    );

  if (fetchError || !dueDates) {
    return NextResponse.json(
      { error: "Failed to fetch due dates", details: fetchError?.message },
      { status: 500 }
    );
  }

  let notificationsSent = 0;
  let emailsSent = 0;
  let pushSent = 0;

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

    // Determine which reminder window matched
    const is1Day = dueDate.due_date === tomorrow && !dueDate.reminder_sent_1d;
    const is7Day = dueDate.due_date === in7Days && !dueDate.reminder_sent_7d;
    const is14Day = dueDate.due_date === in14Days && !dueDate.reminder_sent_14d;
    const is30Day = dueDate.due_date === in30Days && !dueDate.reminder_sent_30d;

    // Fetch user notification preferences (used for window check + push type filter)
    const { data: userPrefs } = await supabase
      .from("notification_preferences")
      .select("reminder_days, tuv_enabled, service_enabled, oil_enabled")
      .eq("user_id", vehicle.user_id)
      .single();

    // For non-1-day reminders, check if the user's preference matches this window
    // 1-day reminders are always sent as a final warning
    if (!is1Day) {
      const userReminderDays = userPrefs?.reminder_days ?? 7; // default: 7 days
      const matchedDays = is7Day ? 7 : is14Day ? 14 : is30Day ? 30 : 0;

      if (matchedDays !== userReminderDays) {
        // Mark as sent so we don't re-check, but don't send notification
        const skipFlag: Record<string, boolean> = {};
        if (is7Day) skipFlag.reminder_sent_7d = true;
        if (is14Day) skipFlag.reminder_sent_14d = true;
        if (is30Day) skipFlag.reminder_sent_30d = true;
        await supabase
          .from("vehicle_due_dates")
          .update(skipFlag)
          .eq("id", dueDate.id);
        continue;
      }
    }

    const daysRemaining = is1Day ? 1 : is7Day ? 7 : is14Day ? 14 : 30;
    const daysLabel = daysRemaining === 1 ? "morgen" : `in ${daysRemaining} Tagen`;

    // Create in-app notification
    await supabase.from("notifications").insert({
      user_id: vehicle.user_id,
      type: "service_reminder",
      reference_id: dueDate.vehicle_id,
      message: `${typeLabel} für ${vehicleName} ${daysLabel} fällig (${dueDateFormatted})`,
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
            from: "Oldtimer Docs <noreply@oldtimer-docs.com>",
            to: userEmail,
            subject: `${typeLabel} für ${vehicleName} ${daysLabel} fällig`,
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

    // Send Web Push notifications
    if (vapidPublic && vapidPrivate) {
      // Check if this reminder type is enabled (defaults to true)
      const isTuv = dueDate.due_type === "tuv_hu";
      const isOil = dueDate.due_type?.startsWith("oil_");
      const typeEnabled = userPrefs
        ? (isTuv && userPrefs.tuv_enabled) ||
          (isOil && userPrefs.oil_enabled) ||
          (!isTuv && !isOil && userPrefs.service_enabled)
        : true;

      if (typeEnabled) {
        const { data: subscriptions } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", vehicle.user_id);

        for (const sub of subscriptions ?? []) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              JSON.stringify({
                title: `${typeLabel} Erinnerung`,
                body: `${typeLabel} für ${vehicleName} ${daysLabel} fällig (${dueDateFormatted})`,
                tag: `reminder-${dueDate.id}`,
                url: `/vehicles/${dueDate.vehicle_id}/scheckheft`,
              })
            );
            pushSent++;
          } catch (pushError: unknown) {
            // Remove invalid subscriptions (410 Gone or 404)
            const statusCode = (pushError as { statusCode?: number })?.statusCode;
            if (statusCode === 410 || statusCode === 404) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("endpoint", sub.endpoint);
            }
          }
        }
      }
    }

    // Update reminder flags
    const updateData: Record<string, unknown> = {};
    if (is1Day) updateData.reminder_sent_1d = true;
    if (is7Day) updateData.reminder_sent_7d = true;
    if (is14Day) updateData.reminder_sent_14d = true;
    if (is30Day) updateData.reminder_sent_30d = true;

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
    pushSent,
  });
}
