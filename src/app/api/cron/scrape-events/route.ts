import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { getPlzCoordinates } from "@/lib/geo";

// Use service role key for cron — bypasses RLS
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

const SOURCE_URL = "https://oldtimer-markt.de/aktuell/termine";

interface ScrapedEvent {
  name: string;
  date_start: string;
  date_end: string | null;
  location: string;
  plz: string;
  lat: number;
  lng: number;
  category: string;
  description: string | null;
  entry_price: string | null;
  website_url: string | null;
  source_url: string;
}

// Keywords for category classification
const RALLYE_KEYWORDS = ["rallye", "rally", "ausfahrt", "tour", "rundfahrt", "wertungsfahrt"];
const MESSE_KEYWORDS = ["messe", "börse", "teilemarkt", "markt", "ausstellung", "museum", "salon"];

/**
 * Classify an event into a category based on its name.
 */
function classifyCategory(name: string): string {
  const lower = name.toLowerCase();
  if (RALLYE_KEYWORDS.some((kw) => lower.includes(kw))) return "rallye";
  if (MESSE_KEYWORDS.some((kw) => lower.includes(kw))) return "messe";
  return "regional";
}

/**
 * Extract PLZ and location from a text like "74889 Sinsheim - Museumsplatz"
 */
function parseLocation(text: string): { plz: string; location: string } | null {
  const match = text.match(/(\d{5})\s+(.+)/);
  if (!match) return null;
  return { plz: match[1], location: match[2].trim() };
}

/**
 * Scrape events from oldtimer-markt.de/aktuell/termine.
 * The page uses a DataTable with id="termine".
 * Each <tr> has 5 <td> columns: Land, Beginn, Ende, Veranstaltung, Info.
 */
async function scrapeEvents(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];

  try {
    const res = await fetch(SOURCE_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OldtimerDocs/1.0)",
        Accept: "text/html",
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch ${SOURCE_URL}: ${res.status}`);
      return events;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // The events are in <table id="termine"> <tbody> <tr>
    $("#termine tbody tr").each((_, row) => {
      try {
        const tds = $(row).find("td");
        if (tds.length < 5) return;

        // Column 0: Country flag — only process German events
        const countryAlt = tds.eq(0).find("img").attr("alt") ?? "";
        if (countryAlt !== "Deutschland") return;

        // Column 1: Start date — data-order="2026-04-07"
        const dateStart = tds.eq(1).attr("data-order") ?? null;
        if (!dateStart) return;

        // Skip past events
        const today = new Date().toISOString().split("T")[0];
        if (dateStart < today) return;

        // Column 2: End date — data-order="2026-04-10"
        const dateEnd = tds.eq(2).attr("data-order") ?? null;

        // Column 3: Event name + location
        // Structure: "Event Name<br> PLZ Ort - Adresse<br><i>phone</i>"
        const eventTd = tds.eq(3);
        const eventHtml = eventTd.html() ?? "";
        const parts = eventHtml.split(/<br\s*\/?>/i);

        const name = $(parts[0]).text().trim() || parts[0]?.trim() || "";
        if (!name) return;

        // Second part: " PLZ Ort - Adresse"
        const locationRaw = parts[1] ? $(parts[1]).text().trim() || parts[1].trim() : "";
        const parsed = parseLocation(locationRaw);
        if (!parsed) return;

        // Column 4: Links
        let websiteUrl: string | null = null;
        tds.eq(4).find("a").each((_, link) => {
          const href = $(link).attr("href") ?? "";
          if (href.startsWith("http") && !href.includes("mailto:")) {
            websiteUrl = href;
          }
        });

        const category = classifyCategory(name);
        const sourceUrl = `${SOURCE_URL}#${encodeURIComponent(name.substring(0, 100))}`;

        events.push({
          name: name.substring(0, 300),
          date_start: dateStart,
          date_end: dateEnd !== dateStart ? dateEnd : null,
          location: parsed.location.substring(0, 200),
          plz: parsed.plz,
          lat: 0,
          lng: 0,
          category,
          description: null,
          entry_price: null,
          website_url: websiteUrl,
          source_url: sourceUrl.substring(0, 500),
        });
      } catch {
        // Skip individual event parse errors
      }
    });
  } catch (err) {
    console.error(`Error scraping ${SOURCE_URL}:`, err);
  }

  return events;
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

  const events = await scrapeEvents();
  const totalScraped = events.length;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const event of events) {
    // Geocode the PLZ
    const coords = await getPlzCoordinates(event.plz);
    if (!coords) {
      totalSkipped++;
      continue;
    }
    event.lat = coords.lat;
    event.lng = coords.lng;

    // Upsert: use source_url as unique key for deduplication
    const { error, status } = await supabase
      .from("events")
      .upsert(
        {
          name: event.name,
          date_start: event.date_start,
          date_end: event.date_end,
          location: event.location,
          plz: event.plz,
          lat: event.lat,
          lng: event.lng,
          category: event.category,
          description: event.description,
          entry_price: event.entry_price,
          website_url: event.website_url,
          source_url: event.source_url,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "source_url" }
      );

    if (error) {
      console.error(`Error upserting event "${event.name}":`, error.message);
      totalSkipped++;
    } else if (status === 201) {
      totalInserted++;
    } else {
      totalUpdated++;
    }
  }

  // Clean up past events (older than 7 days)
  const cleanupDate = new Date();
  cleanupDate.setDate(cleanupDate.getDate() - 7);
  const { count: deletedCount } = await supabase
    .from("events")
    .delete({ count: "exact" })
    .lt("date_start", cleanupDate.toISOString().split("T")[0]);

  return NextResponse.json({
    success: true,
    totalScraped,
    totalInserted,
    totalUpdated,
    totalSkipped,
    deletedPastEvents: deletedCount ?? 0,
  });
}
