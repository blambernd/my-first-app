import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { searchParts } from "@/lib/parts-search";
import { AlertMatchesEmail } from "@/emails/alert-matches";
import { formatPrice } from "@/lib/validations/parts";

const CONDITION_LABELS: Record<string, string> = {
  new: "Neu",
  used: "Gebraucht",
  unknown: "Unbekannt",
};

// Use service role key for cron — bypasses RLS
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
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

  if (!process.env.SERPAPI_API_KEY) {
    return NextResponse.json(
      { error: "SERPAPI_API_KEY not configured" },
      { status: 503 }
    );
  }

  const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

  // Fetch all active alerts
  const { data: alerts, error: alertsError } = await supabase
    .from("part_alerts")
    .select("*")
    .eq("status", "active")
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(20); // Process max 20 alerts per cron run to stay within API limits

  if (alertsError || !alerts) {
    return NextResponse.json(
      { error: "Failed to fetch alerts", details: alertsError?.message },
      { status: 500 }
    );
  }

  let totalMatches = 0;
  let alertsChecked = 0;
  let emailsSent = 0;

  for (const alert of alerts) {
    try {
      // Search for parts matching this alert
      const result = await searchParts(
        {
          query: alert.search_query,
          make: alert.vehicle_make,
          model: alert.vehicle_model,
          year: alert.vehicle_year,
          condition: alert.condition_filter,
          maxPrice: alert.max_price_cents
            ? alert.max_price_cents / 100
            : undefined,
        },
        undefined,
        1,
        50
      );

      // Collect all listings from all groups
      const allListings = result.groups.flatMap((g) => g.listings);

      if (allListings.length > 0) {
        // Check which listings are new (not already in part_alert_matches)
        const { data: existingMatches } = await supabase
          .from("part_alert_matches")
          .select("url")
          .eq("alert_id", alert.id);

        const existingUrls = new Set(
          (existingMatches || []).map((m: { url: string }) => m.url)
        );
        const newListings = allListings.filter(
          (l) => !existingUrls.has(l.url)
        );

        if (newListings.length > 0) {
          // Insert new matches
          const matchInserts = newListings.map((listing) => ({
            alert_id: alert.id,
            title: listing.title,
            price_cents: listing.price
              ? Math.round(listing.price * 100)
              : null,
            condition: listing.condition,
            platform: listing.platform,
            platform_label: listing.platformLabel,
            url: listing.url,
            image_url: listing.imageUrl,
          }));

          await supabase.from("part_alert_matches").insert(matchInserts);

          // Create in-app notification
          await supabase.from("notifications").insert({
            user_id: alert.user_id,
            type: "part_alert_match",
            reference_id: alert.id,
            message: `${newListings.length} neue Treffer für "${alert.search_query}" (${alert.vehicle_make} ${alert.vehicle_model})`,
          });

          totalMatches += newListings.length;

          // Send email summary (max 1 per alert per cron run)
          if (resend) {
            const { data: userData } = await supabase.auth.admin.getUserById(
              alert.user_id
            );
            const userEmail = userData?.user?.email;

            if (userEmail) {
              try {
                await resend.emails.send({
                  from: "Oldtimer Docs <noreply@oldtimer-docs.com>",
                  to: userEmail,
                  subject: `${newListings.length} neue Treffer für "${alert.search_query}"`,
                  react: AlertMatchesEmail({
                    vehicleName: `${alert.vehicle_make} ${alert.vehicle_model} (${alert.vehicle_year})`,
                    searchQuery: alert.search_query,
                    matches: newListings.slice(0, 10).map((l) => ({
                      title: l.title,
                      price: l.price != null ? formatPrice(l.price) : null,
                      platform: l.platformLabel,
                      url: l.url,
                      condition: CONDITION_LABELS[l.condition] || "Unbekannt",
                    })),
                    alertCount: newListings.length,
                  }),
                });
                emailsSent++;
              } catch {
                // Email sending failed, continue with other alerts
              }
            }
          }
        }
      }

      // Update last_checked_at
      await supabase
        .from("part_alerts")
        .update({ last_checked_at: new Date().toISOString() })
        .eq("id", alert.id);

      alertsChecked++;
    } catch {
      // Individual alert check failed, continue with others
    }
  }

  return NextResponse.json({
    success: true,
    alertsChecked,
    totalMatches,
    emailsSent,
  });
}
