import { getJson } from "serpapi";
import type { MarketSearchParams, MarketListing, MarketSearchResult } from "./types";
import { isSparePartListing, parsePrice, isPricePlausible, matchesFactoryCode, extractRichSnippetPrice } from "./filters";

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
  platformLabel: string
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

    // Filter: skip spare parts listings
    if (isSparePartListing(title, snippet)) continue;

    // Relevance filter: title should mention the make
    const titleLower = title.toLowerCase();
    const isMakeRelevant = makeAliases.some((a) => titleLower.includes(a));
    if (!isMakeRelevant) continue;

    // Filter: check factory code match (e.g. reject W124 when searching W123)
    if (params.factoryCode && !matchesFactoryCode(title, snippet, params.factoryCode)) continue;

    // Try to extract price from rich snippet, title, then snippet
    const price = extractRichSnippetPrice(item) ?? parsePrice(title) ?? parsePrice(snippet);

    // Validate price plausibility
    if (price !== null && !isPricePlausible(price, title, snippet)) continue;

    listings.push({
      title,
      price,
      platform: platformLabel,
      url: link,
    });
  }

  return listings;
}

/**
 * Run a single Google search query for a site.
 */
async function runGoogleQuery(
  query: string,
  site: string,
  apiKey: string
): Promise<Record<string, unknown>[]> {
  const fullQuery = `${query} site:${site}`;

  const result = await Promise.race([
    getJson({
      engine: "google",
      q: fullQuery,
      gl: "de",
      hl: "de",
      num: 20,
      api_key: apiKey,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 15000)
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
): Promise<{ listings: MarketListing[]; error?: string }> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return { listings: [], error: "SERPAPI_API_KEY nicht konfiguriert" };

  try {
    const queries = buildQueryVariants(params);

    // Run all query variants in parallel
    const results = await Promise.allSettled(
      queries.map((q) => runGoogleQuery(q, site, apiKey))
    );

    // Collect all organic results
    const allResults: Record<string, unknown>[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allResults.push(...result.value);
      }
    }

    // Extract and filter listings
    const listings = extractListings(allResults, params, platformLabel);

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = listings.filter((l) => {
      if (seen.has(l.url)) return false;
      seen.add(l.url);
      return true;
    });

    return { listings: unique };
  } catch (error) {
    return {
      listings: [],
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

/**
 * Search eBay via the dedicated eBay SerpAPI engine with multiple query variants.
 */
async function searchEbay(params: MarketSearchParams): Promise<{ listings: MarketListing[]; error?: string }> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return { listings: [], error: "SERPAPI_API_KEY nicht konfiguriert" };

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
            setTimeout(() => reject(new Error("Timeout")), 15000)
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
        const priceInfo = item.price as Record<string, unknown> | undefined;
        const price = priceInfo?.extracted ? Number(priceInfo.extracted) : null;

        if (isSparePartListing(title)) continue;
        if (price !== null && (price < 1000 || price > 5_000_000)) continue;

        const titleLower = title.toLowerCase();
        if (!makeAliases.some((a) => titleLower.includes(a))) continue;
        if (params.factoryCode && !matchesFactoryCode(title, "", params.factoryCode)) continue;

        allListings.push({
          title,
          price,
          platform: "eBay",
          url: String(item.link || ""),
        });
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = allListings.filter((l) => {
      if (seen.has(l.url)) return false;
      seen.add(l.url);
      return true;
    });

    return { listings: unique };
  } catch (error) {
    return {
      listings: [],
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
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

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      allListings.push(...result.value.listings);
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

  // Final deduplication across platforms (same URL from different queries)
  const seen = new Set<string>();
  const deduplicated = allListings.filter((l) => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });

  return { listings: deduplicated, platformErrors };
}
