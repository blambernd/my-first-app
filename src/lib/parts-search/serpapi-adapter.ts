import { getJson } from "serpapi";
import type { PlatformAdapter, SearchParams, SearchResultItem } from "./types";
import {
  getSpecialistSites,
  buildSiteFilter,
  getSpecialistLabel,
} from "./manufacturer-sites";

function buildSearchQuery(params: SearchParams): string {
  // Quote make+model to avoid cross-brand results (e.g. BMW parts for Mercedes)
  const vehicle = `"${params.make}" "${params.model}"`;
  const partNumber = params.partNumber ? `"${params.partNumber}"` : "";
  return `${vehicle} ${params.year} ${params.query} ${partNumber} Ersatzteil`.replace(/\s+/g, " ").trim();
}

function mapCondition(
  conditionText: string | undefined
): "new" | "used" | "unknown" {
  if (!conditionText) return "unknown";
  const lower = conditionText.toLowerCase();
  if (lower.includes("neu") || lower.includes("new")) return "new";
  if (
    lower.includes("gebraucht") ||
    lower.includes("used") ||
    lower.includes("refurbished")
  )
    return "used";
  return "unknown";
}

function filterByCondition(
  items: SearchResultItem[],
  condition: "all" | "new" | "used"
): SearchResultItem[] {
  if (condition === "all") return items;
  return items.filter(
    (item) => item.condition === condition || item.condition === "unknown"
  );
}

function filterByPrice(
  items: SearchResultItem[],
  minPrice?: number,
  maxPrice?: number
): SearchResultItem[] {
  return items.filter((item) => {
    if (item.price === null) return true;
    if (minPrice !== undefined && item.price < minPrice) return false;
    if (maxPrice !== undefined && item.price > maxPrice) return false;
    return true;
  });
}

/**
 * eBay Kleinanzeigen adapter using SerpAPI's eBay engine
 */
export const ebayKleinanzeigenAdapter: PlatformAdapter = {
  id: "ebay_kleinanzeigen",
  label: "eBay Kleinanzeigen",
  async search(params: SearchParams): Promise<SearchResultItem[]> {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) return [];

    const result = await getJson({
      engine: "ebay",
      ebay_domain: "ebay.de",
      _nkw: buildSearchQuery(params),
      api_key: apiKey,
    });

    if (result.error) {
      throw new Error(`SerpAPI eBay: ${result.error}`);
    }

    const organicResults = result.organic_results || [];

    let items: SearchResultItem[] = organicResults.map(
      (item: Record<string, unknown>) => ({
        title: String(item.title || ""),
        price: (item.price as Record<string, unknown> | undefined)?.extracted
          ? Number((item.price as Record<string, unknown>).extracted)
          : null,
        currency: "EUR",
        condition: mapCondition(String(item.condition || "")),
        url: String(item.link || ""),
        imageUrl: item.thumbnail ? String(item.thumbnail) : null,
        seller: (item.seller_info as Record<string, unknown> | undefined)?.name
          ? String((item.seller_info as Record<string, unknown>).name)
          : null,
      })
    );

    items = filterByCondition(items, params.condition);
    items = filterByPrice(items, params.minPrice, params.maxPrice);

    return items.slice(0, 20);
  },
};

/**
 * Google Shopping adapter — searches across all sellers
 */
export const googleShoppingAdapter: PlatformAdapter = {
  id: "google_shopping",
  label: "Google Shopping",
  async search(params: SearchParams): Promise<SearchResultItem[]> {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) return [];

    const result = await getJson({
      engine: "google_shopping",
      q: buildSearchQuery(params),
      gl: "de",
      hl: "de",
      api_key: apiKey,
    });

    if (result.error) {
      throw new Error(`SerpAPI Google Shopping: ${result.error}`);
    }

    const shoppingResults = result.shopping_results || [];

    let items: SearchResultItem[] = shoppingResults.map(
      (item: Record<string, unknown>) => ({
        title: String(item.title || ""),
        price: item.extracted_price
          ? Number(item.extracted_price)
          : null,
        currency: "EUR",
        condition: mapCondition(String(item.second_hand_condition || "")),
        url: String(item.link || ""),
        imageUrl: item.thumbnail ? String(item.thumbnail) : null,
        seller: item.source ? String(item.source) : null,
      })
    );

    items = filterByCondition(items, params.condition);
    items = filterByPrice(items, params.minPrice, params.maxPrice);

    return items.slice(0, 40);
  },
};

/** Auto recycler / salvage yard sites — relevant for all manufacturers */
const RECYCLER_SITES = [
  "autoverwertung.net",
  "teilehaber.de",
  "autorecycling.de",
  "car-parts.com",
  "gebrauchte-autoteile24.de",
  "autoteile-markt.de",
  "schrottplatz.de",
  "kfz-verwerter.net",
  "autodemontage24.de",
  "autoverwertung-bayern.de",
];

/**
 * Parse Google organic results into SearchResultItems.
 * Shared by specialist and recycler adapters.
 */
function parseGoogleOrganicResults(
  organicResults: Record<string, unknown>[],
  params: SearchParams,
  limit: number
): SearchResultItem[] {
  let items: SearchResultItem[] = organicResults.map(
    (item: Record<string, unknown>) => {
      const snippet = String(item.snippet || "");
      const priceMatch = snippet.match(
        /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))\s*€|€\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/
      );
      let price: number | null = null;
      if (priceMatch) {
        const priceStr = (priceMatch[1] || priceMatch[2])
          .replace(/\./g, "")
          .replace(",", ".");
        price = parseFloat(priceStr);
        if (isNaN(price)) price = null;
      }

      const link = String(item.link || "");
      let seller: string | null = null;
      try {
        seller = new URL(link).hostname.replace(/^www\./, "");
      } catch {
        seller = null;
      }

      return {
        title: String(item.title || ""),
        price,
        currency: "EUR",
        condition: mapCondition(snippet),
        url: link,
        imageUrl: item.thumbnail ? String(item.thumbnail) : null,
        seller,
      };
    }
  );

  items = filterByCondition(items, params.condition);
  items = filterByPrice(items, params.minPrice, params.maxPrice);
  return items.slice(0, limit);
}

/**
 * Run a Google Search with site: filters and return parsed results.
 */
async function searchGoogleWithSiteFilter(
  params: SearchParams,
  sites: string[],
  errorLabel: string,
  limit = 20
): Promise<SearchResultItem[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return [];

  const partQuery = buildSearchQuery(params);
  const siteFilter = buildSiteFilter(sites);
  const fullQuery = `${partQuery} (${siteFilter})`;

  const result = await getJson({
    engine: "google",
    q: fullQuery,
    gl: "de",
    hl: "de",
    num: limit,
    api_key: apiKey,
  });

  if (result.error) {
    throw new Error(`SerpAPI ${errorLabel}: ${result.error}`);
  }

  return parseGoogleOrganicResults(
    result.organic_results || [],
    params,
    limit
  );
}

/**
 * Specialist adapter — searches manufacturer-specific shops via Google Search
 */
export function createSpecialistAdapter(make: string): PlatformAdapter {
  const sites = getSpecialistSites(make);
  const label = getSpecialistLabel(make);

  return {
    id: "specialist",
    label,
    async search(params: SearchParams): Promise<SearchResultItem[]> {
      return searchGoogleWithSiteFilter(params, sites, "Spezialisten", 20);
    },
  };
}

/**
 * Recycler adapter — searches auto salvage yards and recyclers
 */
export const recyclerAdapter: PlatformAdapter = {
  id: "recycler",
  label: "Verwerter",
  async search(params: SearchParams): Promise<SearchResultItem[]> {
    return searchGoogleWithSiteFilter(params, RECYCLER_SITES, "Verwerter", 20);
  },
};
