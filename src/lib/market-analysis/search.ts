import { getJson } from "serpapi";
import type { MarketSearchParams, MarketListing, MarketSearchResult } from "./types";
import { isSparePartListing, parsePrice, isPricePlausible, matchesFactoryCode } from "./filters";

/**
 * Build a Google Search query for finding vehicle listings on a specific platform.
 * Searches for the vehicle as a whole (not parts).
 */
function buildVehicleQuery(params: MarketSearchParams): string {
  const parts: string[] = [];

  // Vehicle identification
  parts.push(`"${params.make}"`);

  if (params.factoryCode) {
    parts.push(`"${params.factoryCode}"`);
  }
  parts.push(`"${params.model}"`);

  // Year range: ±5 years to find comparable vehicles
  const yearLow = params.year - 5;
  const yearHigh = params.year + 5;
  parts.push(`${yearLow}..${yearHigh}`);

  // Exclude spare parts from results
  parts.push("-Ersatzteil -Ersatzteile -Modellauto -Teile");

  return parts.join(" ");
}

/**
 * Search a platform via Google Search with site: filter.
 */
async function searchPlatform(
  params: MarketSearchParams,
  site: string,
  platformLabel: string
): Promise<{ listings: MarketListing[]; error?: string }> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return { listings: [], error: "SERPAPI_API_KEY nicht konfiguriert" };

  try {
    const vehicleQuery = buildVehicleQuery(params);
    const fullQuery = `${vehicleQuery} site:${site}`;

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
        setTimeout(() => reject(new Error("Timeout")), 10000)
      ),
    ]);

    if (result.error) {
      return { listings: [], error: `SerpAPI: ${result.error}` };
    }

    const organicResults = (result.organic_results || []) as Record<string, unknown>[];

    const listings: MarketListing[] = [];
    for (const item of organicResults) {
      const title = String(item.title || "");
      const snippet = String(item.snippet || "");
      const link = String(item.link || "");

      // Filter: skip spare parts listings
      if (isSparePartListing(title, snippet)) continue;

      // Relevance filter: title should mention the make
      const titleLower = title.toLowerCase();
      const makeLower = params.make.toLowerCase();
      const makeAliases = [makeLower];
      if (makeLower === "mercedes-benz") makeAliases.push("mercedes");
      if (makeLower === "volkswagen") makeAliases.push("vw");

      const isMakeRelevant = makeAliases.some((a) => titleLower.includes(a));
      if (!isMakeRelevant) continue;

      // Filter: check factory code match (e.g. reject W124 when searching W123)
      if (params.factoryCode && !matchesFactoryCode(title, snippet, params.factoryCode)) continue;

      // Try to extract price from title first, then snippet
      const price = parsePrice(title) ?? parsePrice(snippet);

      // Validate price plausibility
      if (price !== null && !isPricePlausible(price, title, snippet)) continue;

      listings.push({
        title,
        price,
        platform: platformLabel,
        url: link,
      });
    }

    return { listings };
  } catch (error) {
    return {
      listings: [],
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

/**
 * Search eBay via the dedicated eBay SerpAPI engine for vehicle listings.
 */
async function searchEbay(params: MarketSearchParams): Promise<{ listings: MarketListing[]; error?: string }> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return { listings: [], error: "SERPAPI_API_KEY nicht konfiguriert" };

  try {
    const queryParts = [params.make, params.model];
    if (params.factoryCode) queryParts.push(params.factoryCode);
    queryParts.push(String(params.year));

    const result = await Promise.race([
      getJson({
        engine: "ebay",
        ebay_domain: "ebay.de",
        _nkw: queryParts.join(" "),
        _sacat: "9801", // eBay category: Autos & Motorräder > Oldtimer
        api_key: apiKey,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 10000)
      ),
    ]);

    if (result.error) {
      return { listings: [], error: `SerpAPI eBay: ${result.error}` };
    }

    const organicResults = (result.organic_results || []) as Record<string, unknown>[];

    const listings: MarketListing[] = [];
    for (const item of organicResults) {
      const title = String(item.title || "");
      const priceInfo = item.price as Record<string, unknown> | undefined;
      const price = priceInfo?.extracted ? Number(priceInfo.extracted) : null;

      // Filter: skip spare parts
      if (isSparePartListing(title)) continue;

      // Filter: price must be in vehicle range (not accessories/parts)
      if (price !== null && (price < 1000 || price > 5_000_000)) continue;

      // Relevance filter
      const titleLower = title.toLowerCase();
      const makeLower = params.make.toLowerCase();
      const makeAliases = [makeLower];
      if (makeLower === "mercedes-benz") makeAliases.push("mercedes");
      if (makeLower === "volkswagen") makeAliases.push("vw");

      if (!makeAliases.some((a) => titleLower.includes(a))) continue;

      // Filter: check factory code match
      if (params.factoryCode && !matchesFactoryCode(title, "", params.factoryCode)) continue;

      listings.push({
        title,
        price,
        platform: "eBay",
        url: String(item.link || ""),
      });
    }

    return { listings };
  } catch (error) {
    return {
      listings: [],
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}

/**
 * Search all platforms in parallel and collect results.
 */
export async function searchMarketListings(
  params: MarketSearchParams
): Promise<MarketSearchResult> {
  const searches = [
    searchPlatform(params, "mobile.de", "mobile.de"),
    searchPlatform(params, "classic-trader.com", "Classic Trader"),
    searchEbay(params),
  ];

  const results = await Promise.allSettled(searches);

  const allListings: MarketListing[] = [];
  const platformErrors: Array<{ platform: string; error: string }> = [];
  const platformNames = ["mobile.de", "Classic Trader", "eBay"];

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

  return { listings: allListings, platformErrors };
}

