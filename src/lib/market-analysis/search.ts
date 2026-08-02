import { getJson } from "serpapi";
import type {
  MarketSearchParams,
  MarketListing,
  MarketSearchResult,
  RejectedListing,
} from "./types";
import {
  isSparePartListing,
  parseAnchoredPrice,
  isPricePlausible,
  matchesFactoryCode,
  extractRichSnippetPrice,
  hasForeignCurrency,
} from "./filters";
import { canonicalListingKey, hostMatchesSite } from "./urls";
import {
  isAggregatePage,
  hasVehicleAttributes,
  type Ablehnungsgrund,
} from "./classification";

/**
 * Wie viele verworfene Treffer gespeichert werden. Die Zählung je Grund ist
 * vollständig; die Einzeltreffer sind gedeckelt, damit ein Analysedatensatz
 * nicht unbegrenzt wächst.
 */
export const MAX_REJECTED_STORED = 50;

/**
 * Zeitlimit je Einzelabfrage (BUG-11).
 *
 * Die Anforderung lautet: Ergebnis in höchstens 15 Sekunden. Gemessen wurden
 * 15,1 s — genau am Limit, weil das alte Limit selbst bei 15 s lag und die
 * Abfragen zwar parallel laufen, das Einsammeln aber noch Zeit kostet.
 */
const QUERY_TIMEOUT_MS = 10_000;

/**
 * Quellen, die eine zweite Ergebnisseite bekommen (BUG-5).
 *
 * Aus der Messung an 396 echten Treffern: mobile.de (141) und AutoScout24 (60)
 * lieferten über die Google-Suche **keine einzige** Fahrzeug-Detailseite,
 * ausschließlich Suchergebnisseiten. Classic Trader stellte 99 von 100
 * verwertbaren Treffern. Zusätzliche Tiefe lohnt daher nur dort.
 */
const DEEP_SEARCH_SITES = new Set(["classic-trader.com"]);

/**
 * Höchstzahl gespeicherter Beispiele **je Grund** (BUG-10).
 *
 * Ein globaler Deckel allein füllte sich nach der Plattformreihenfolge: 50 von
 * 275 Ablehnungen, fast alle vom ersten Anbieter. Wer sich ansieht, was
 * aussortiert wurde, bekam damit ein verzerrtes Bild. Pro Grund zu deckeln
 * sorgt dafür, dass jeder Grund mit Beispielen vertreten ist.
 */
const MAX_REJECTED_PER_REASON = 6;

/**
 * Sammelt verworfene Treffer und zählt die Gründe.
 *
 * Die Zählung ist immer vollständig; gedeckelt sind nur die Beispiele.
 */
class RejectionLog {
  readonly items: RejectedListing[] = [];
  readonly counts: Partial<Record<Ablehnungsgrund, number>> = {};

  add(listing: Omit<RejectedListing, "reason">, reason: Ablehnungsgrund): void {
    this.counts[reason] = (this.counts[reason] ?? 0) + 1;
    this.push({ ...listing, reason });
  }

  private push(item: RejectedListing): void {
    if (this.items.length >= MAX_REJECTED_STORED) return;
    const jeGrund = this.items.filter((i) => i.reason === item.reason).length;
    if (jeGrund >= MAX_REJECTED_PER_REASON) return;
    this.items.push(item);
  }

  merge(other: RejectionLog): void {
    for (const [reason, count] of Object.entries(other.counts)) {
      const key = reason as Ablehnungsgrund;
      this.counts[key] = (this.counts[key] ?? 0) + (count ?? 0);
    }
    for (const item of other.items) this.push(item);
  }
}

/**
 * Build multiple Google Search query variants for a vehicle.
 * More variants = more coverage, but also more API calls.
 */
function buildQueryVariants(params: MarketSearchParams): string[] {
  const exclude = "-Ersatzteil -Ersatzteile -Modellauto -Teile -Minichamps -Norev";
  const yearLow = params.year - 5;
  const yearHigh = params.year + 5;
  const yearRange = `${yearLow}..${yearHigh}`;

  const variants: string[] = [];

  // Variant A (precise): Make + FactoryCode + Model + Year range
  if (params.factoryCode) {
    variants.push(
      `"${params.make}" "${params.factoryCode}" "${params.model}" ${yearRange} ${exclude}`
    );
  }

  // Variant B (standard): Make + Model + Year range (no factory code)
  variants.push(
    `"${params.make}" "${params.model}" ${yearRange} ${exclude}`
  );

  // Variant C (broad): Make + Model + FactoryCode without year range
  // Catches listings that don't mention the year explicitly
  if (params.factoryCode) {
    variants.push(
      `"${params.make}" "${params.model}" "${params.factoryCode}" ${exclude}`
    );
  }

  return variants;
}

/**
 * Extract and filter listings from SerpAPI Google organic results.
 */
function extractListings(
  organicResults: Record<string, unknown>[],
  params: MarketSearchParams,
  platformLabel: string,
  rejections: RejectionLog,
  site: string
): MarketListing[] {
  const listings: MarketListing[] = [];
  const makeLower = params.make.toLowerCase();
  const makeAliases = [makeLower];
  if (makeLower === "mercedes-benz") makeAliases.push("mercedes");
  if (makeLower === "volkswagen") makeAliases.push("vw");
  if (makeLower === "bmw") makeAliases.push("bmw");

  for (const item of organicResults) {
    const title = String(item.title || "");
    const snippet = String(item.snippet || "");
    const link = String(item.link || "");
    const treffer = { title, url: link, platform: platformLabel };

    // BUG-3: Google nimmt `site:` als Wunsch, nicht als Bedingung. Eine Suche
    // auf autoscout24.de lieferte de.wikipedia.org — und der Treffer trug
    // anschließend das Etikett "AutoScout24".
    if (!hostMatchesSite(link, site)) {
      rejections.add(treffer, "fremde_seite");
      continue;
    }

    if (isSparePartListing(title, snippet)) {
      rejections.add(treffer, "ersatzteil");
      continue;
    }

    // Größter Einzelposten der Fehltreffer: Suchergebnis- und Übersichtsseiten.
    // Muss vor der Merkmalsprüfung stehen — solche Seiten nennen durchaus
    // Jahreszahlen ("10 gebrauchte Mercedes-Benz 220 aus dem Jahr 1960").
    if (isAggregatePage(link, title)) {
      rejections.add(treffer, "uebersichtsseite");
      continue;
    }

    const titleLower = title.toLowerCase();
    if (!makeAliases.some((a) => titleLower.includes(a))) {
      rejections.add(treffer, "falsche_marke");
      continue;
    }

    if (params.factoryCode && !matchesFactoryCode(title, snippet, params.factoryCode)) {
      rejections.add(treffer, "falscher_typcode");
      continue;
    }

    // Ein Vergleichsfahrzeug muss mindestens ein Fahrzeugmerkmal nennen
    // (Baujahr, Laufleistung, Leistung oder Hubraum).
    if (!hasVehicleAttributes(title, snippet)) {
      rejections.add(treffer, "keine_fahrzeugmerkmale");
      continue;
    }

    // BUG-2: Fremdwährung verwerfen statt umrechnen. Muss vor der
    // Preisermittlung stehen — sonst landet ein CHF-Betrag als Euro in der
    // Auswertung, wie im Live-Lauf geschehen.
    if (hasForeignCurrency(title, snippet)) {
      rejections.add(treffer, "fremdwaehrung");
      continue;
    }

    // Preis nur noch aus dem Titel oder strukturierten Feldern — das Snippet
    // wird nicht mehr ausgelesen, dort standen die Ab-Preise der Trefferlisten.
    //
    // Titel vor Rich-Snippet, entgegen der bisherigen Reihenfolge: in den
    // Produktionsdaten wurde "Mercedes-Benz 220 Coupe (1954) angeboten für
    // 218.000" als 119.000 € gespeichert und "... angeboten für 189.220" als
    // 54.271 €. Wenn der Verkäufer den Preis im Titel ausschreibt, ist das die
    // belastbarere Angabe.
    const price = parseAnchoredPrice(title) ?? extractRichSnippetPrice(item);

    // BUG-6: Ohne Preis ist es kein Vergleichsfahrzeug. Bisher landeten solche
    // Treffer in der Liste und wurden dem Nutzer als Vergleichsfahrzeug
    // vorgeführt, obwohl sie in keine Berechnung eingingen.
    if (price === null) {
      rejections.add(treffer, "kein_preis");
      continue;
    }

    if (!isPricePlausible(price, title, snippet)) {
      rejections.add(treffer, "preis_unplausibel");
      continue;
    }

    listings.push({ title, price, platform: platformLabel, url: link });
  }

  return listings;
}

/**
 * Entdoppelt über den kanonischen Inseratsschlüssel (BUG-1).
 *
 * Der frühere Vergleich der vollen URL ließ dieselbe Classic-Trader-Anzeige
 * unter /de/, /at/ und /ch/ dreimal durch — im Live-Lauf waren das alle drei
 * bepreisten "Vergleichsfahrzeuge".
 */
function deduplicate(
  listings: MarketListing[],
  rejections: RejectionLog
): MarketListing[] {
  const seen = new Set<string>();
  return listings.filter((l) => {
    const key = canonicalListingKey(l.url);
    if (seen.has(key)) {
      rejections.add(
        { title: l.title, url: l.url, platform: l.platform },
        "doppelt"
      );
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Run a single Google search query for a site.
 */
async function runGoogleQuery(
  query: string,
  site: string,
  apiKey: string,
  start = 0
): Promise<Record<string, unknown>[]> {
  const fullQuery = `${query} site:${site}`;

  const result = await Promise.race([
    getJson({
      engine: "google",
      q: fullQuery,
      gl: "de",
      hl: "de",
      num: 20,
      start,
      api_key: apiKey,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), QUERY_TIMEOUT_MS)
    ),
  ]);

  if (result.error) return [];
  return (result.organic_results || []) as Record<string, unknown>[];
}

/**
 * Search a platform via Google Search with multiple query variants.
 * Deduplicates results by URL.
 */
async function searchPlatform(
  params: MarketSearchParams,
  site: string,
  platformLabel: string
): Promise<{ listings: MarketListing[]; error?: string; rejections: RejectionLog }> {
  const rejections = new RejectionLog();
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    return { listings: [], error: "SERPAPI_API_KEY nicht konfiguriert", rejections };
  }

  try {
    const queries = buildQueryVariants(params);

    // Run all query variants in parallel. Für die einzige Quelle, die
    // Detailseiten liefert, zusätzlich die zweite Ergebnisseite (BUG-5).
    const abfragen = queries.map((q) => runGoogleQuery(q, site, apiKey));
    if (DEEP_SEARCH_SITES.has(site)) {
      abfragen.push(...queries.map((q) => runGoogleQuery(q, site, apiKey, 20)));
    }

    const results = await Promise.allSettled(abfragen);

    // Collect all organic results
    const allResults: Record<string, unknown>[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allResults.push(...result.value);
      }
    }

    // Extract and filter listings
    const listings = extractListings(
      allResults,
      params,
      platformLabel,
      rejections,
      site
    );

    const unique = deduplicate(listings, rejections);

    return { listings: unique, rejections };
  } catch (error) {
    return {
      listings: [],
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
      rejections,
    };
  }
}

/**
 * Search eBay via the dedicated eBay SerpAPI engine with multiple query variants.
 */
async function searchEbay(
  params: MarketSearchParams
): Promise<{ listings: MarketListing[]; error?: string; rejections: RejectionLog }> {
  const rejections = new RejectionLog();
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    return { listings: [], error: "SERPAPI_API_KEY nicht konfiguriert", rejections };
  }

  try {
    // Build eBay query variants
    const ebayQueries: string[] = [];

    // Variant A: Make + Model + FactoryCode + Year
    const partsA = [params.make, params.model];
    if (params.factoryCode) partsA.push(params.factoryCode);
    partsA.push(String(params.year));
    ebayQueries.push(partsA.join(" "));

    // Variant B: Make + Model + Year (no factory code)
    if (params.factoryCode) {
      ebayQueries.push([params.make, params.model, String(params.year)].join(" "));
    }

    const makeLower = params.make.toLowerCase();
    const makeAliases = [makeLower];
    if (makeLower === "mercedes-benz") makeAliases.push("mercedes");
    if (makeLower === "volkswagen") makeAliases.push("vw");

    // Run all eBay queries in parallel
    const results = await Promise.allSettled(
      ebayQueries.map((q) =>
        Promise.race([
          getJson({
            engine: "ebay",
            ebay_domain: "ebay.de",
            _nkw: q,
            _sacat: "9801",
            api_key: apiKey,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), QUERY_TIMEOUT_MS)
          ),
        ])
      )
    );

    const allListings: MarketListing[] = [];
    for (const result of results) {
      if (result.status !== "fulfilled" || result.value.error) continue;

      const organicResults = (result.value.organic_results || []) as Record<string, unknown>[];
      for (const item of organicResults) {
        const title = String(item.title || "");
        const url = String(item.link || "");
        const priceInfo = item.price as Record<string, unknown> | undefined;
        const price = priceInfo?.extracted ? Number(priceInfo.extracted) : null;
        const treffer = { title, url, platform: "eBay" };

        if (isSparePartListing(title)) {
          rejections.add(treffer, "ersatzteil");
          continue;
        }
        if (isAggregatePage(url, title)) {
          rejections.add(treffer, "uebersichtsseite");
          continue;
        }
        if (hasForeignCurrency(title)) {
          rejections.add(treffer, "fremdwaehrung");
          continue;
        }
        // BUG-6: ohne Preis kein Vergleichsfahrzeug
        if (price === null) {
          rejections.add(treffer, "kein_preis");
          continue;
        }
        // BUG-9: getrennt ausweisen. Unter 1.000 € sind es praktisch immer
        // Teile, die die Stichwortliste nicht erfasst hat — nicht "unplausibel".
        if (price < 1000) {
          rejections.add(treffer, "preis_zu_niedrig");
          continue;
        }
        if (price > 5_000_000) {
          rejections.add(treffer, "preis_unplausibel");
          continue;
        }

        const titleLower = title.toLowerCase();
        if (!makeAliases.some((a) => titleLower.includes(a))) {
          rejections.add(treffer, "falsche_marke");
          continue;
        }
        if (params.factoryCode && !matchesFactoryCode(title, "", params.factoryCode)) {
          rejections.add(treffer, "falscher_typcode");
          continue;
        }
        // eBay-Autotitel nennen fast immer das Baujahr; fehlt jedes Merkmal,
        // ist der Treffer meist Literatur oder Zubehör, das die Teileliste
        // nicht erwischt hat.
        if (!hasVehicleAttributes(title)) {
          rejections.add(treffer, "keine_fahrzeugmerkmale");
          continue;
        }

        allListings.push({ title, price, platform: "eBay", url });
      }
    }

    const unique = deduplicate(allListings, rejections);

    return { listings: unique, rejections };
  } catch (error) {
    return {
      listings: [],
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
      rejections,
    };
  }
}

/**
 * Search all platforms in parallel and collect results.
 * Uses multiple query variants per platform for better coverage.
 */
export async function searchMarketListings(
  params: MarketSearchParams
): Promise<MarketSearchResult> {
  const searches = [
    searchPlatform(params, "mobile.de", "mobile.de"),
    searchPlatform(params, "classic-trader.com", "Classic Trader"),
    searchPlatform(params, "autoscout24.de", "AutoScout24"),
    searchEbay(params),
  ];

  const results = await Promise.allSettled(searches);

  const allListings: MarketListing[] = [];
  const platformErrors: Array<{ platform: string; error: string }> = [];
  const platformNames = ["mobile.de", "Classic Trader", "AutoScout24", "eBay"];
  const rejections = new RejectionLog();

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      allListings.push(...result.value.listings);
      rejections.merge(result.value.rejections);
      if (result.value.error) {
        platformErrors.push({ platform: platformNames[i], error: result.value.error });
      }
    } else {
      platformErrors.push({
        platform: platformNames[i],
        error: result.reason?.message || "Fehler",
      });
    }
  }

  // Abschließende Entdopplung über Plattformgrenzen hinweg — dasselbe Inserat
  // kann über mehrere Quellen gefunden werden und darf nur einmal zählen.
  const deduplicated = deduplicate(allListings, rejections);

  return {
    listings: deduplicated,
    platformErrors,
    rejected: rejections.items,
    rejectedCounts: rejections.counts,
  };
}
