import { getJson } from "serpapi";
import type { PlatformAdapter, SearchParams, SearchResultItem } from "./types";

function buildSearchQuery(params: SearchParams): string {
  return `${params.make} ${params.model} ${params.year} ${params.query} Ersatzteil`;
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

    try {
      const result = await getJson({
        engine: "ebay",
        _nonce: "ebay_de",
        ebay_domain: "ebay.de",
        q: buildSearchQuery(params),
        api_key: apiKey,
      });

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
    } catch {
      return [];
    }
  },
};

/**
 * Google Shopping adapter for Mobile.de, Oldtimer-Markt, Classic-Trader
 * Uses SerpAPI's Google Shopping engine with site-specific queries
 */
function createGoogleShoppingAdapter(
  id: string,
  label: string,
  siteDomain?: string
): PlatformAdapter {
  return {
    id,
    label,
    async search(params: SearchParams): Promise<SearchResultItem[]> {
      const apiKey = process.env.SERPAPI_API_KEY;
      if (!apiKey) return [];

      try {
        const siteFilter = siteDomain ? ` site:${siteDomain}` : "";
        const result = await getJson({
          engine: "google_shopping",
          q: buildSearchQuery(params) + siteFilter,
          gl: "de",
          hl: "de",
          api_key: apiKey,
        });

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

        return items.slice(0, 20);
      } catch {
        return [];
      }
    },
  };
}

export const mobileDeAdapter = createGoogleShoppingAdapter(
  "mobile_de",
  "Mobile.de Teile",
  "mobile.de"
);

export const oldtimerMarktAdapter = createGoogleShoppingAdapter(
  "oldtimer_markt",
  "Oldtimer-Markt.de",
  "oldtimer-markt.de"
);

export const classicTraderAdapter = createGoogleShoppingAdapter(
  "classic_trader",
  "Classic-Trader",
  "classic-trader.com"
);
