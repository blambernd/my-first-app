import { getJson } from "serpapi";
import type { PlatformAdapter, SearchParams, SearchResultItem } from "./types";
import {
  getSpecialistSites,
  buildSiteFilter,
  getSpecialistLabel,
  MANUFACTURER_SITES,
} from "./manufacturer-sites";

/**
 * Build the vehicle identifier part of a query.
 * If a factory code is set (e.g. W123, E30), use it alongside the make
 * for more precise results — parts sellers typically list by factory code.
 * Falls back to make + model if no factory code is available.
 */
function vehicleIdentifier(params: SearchParams): { forGoogle: string; forEbay: string } {
  if (params.factoryCode) {
    // "Mercedes-Benz W123" finds parts better than "Mercedes-Benz 230E"
    return {
      forGoogle: `"${params.make}" "${params.factoryCode}"`,
      forEbay: `${params.make} ${params.factoryCode}`,
    };
  }
  return {
    forGoogle: `"${params.make} ${params.model}"`,
    forEbay: `${params.make} ${params.model}`,
  };
}

/**
 * Build search query for Google-based engines (Shopping, Search).
 * Uses quotes for precision.
 */
function buildGoogleQuery(params: SearchParams): string {
  const { forGoogle } = vehicleIdentifier(params);
  const parts = [forGoogle, params.query];
  if (params.partNumber) parts.push(`"${params.partNumber}"`);
  return parts.join(" ");
}

/**
 * Build search query for eBay (no quotes — eBay's _nkw doesn't support them well).
 */
function buildEbayQuery(params: SearchParams): string {
  const { forEbay } = vehicleIdentifier(params);
  const parts = [forEbay, params.query];
  if (params.partNumber) parts.push(params.partNumber);
  return parts.join(" ");
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
 * Known competitor makes — used to filter out wrong-brand results.
 * We collect all makes from MANUFACTURER_SITES plus common ones.
 */
const ALL_KNOWN_MAKES = new Set([
  ...Object.keys(MANUFACTURER_SITES),
  "BMW", "Mercedes-Benz", "Mercedes", "Audi", "Volkswagen", "VW",
  "Opel", "Ford", "Porsche", "Fiat", "Alfa Romeo", "Jaguar",
  "Volvo", "Saab", "Peugeot", "Renault", "Citroën", "Citroen",
  "Toyota", "Mazda", "Honda", "Nissan", "Datsun",
  "Chevrolet", "Dodge", "Buick", "Cadillac",
  "Ferrari", "Lamborghini", "Maserati", "Lancia",
  "Rolls-Royce", "Bentley", "Aston Martin",
  "Triumph", "MG", "Lotus", "Land Rover",
  "Trabant", "Wartburg", "Škoda", "Skoda",
]);

/**
 * Filter out results that clearly belong to a different manufacturer.
 * Checks if the title contains a competing brand name but NOT the searched make.
 */
function filterByMake(
  items: SearchResultItem[],
  make: string
): SearchResultItem[] {
  const makeLower = make.toLowerCase();
  // Build aliases: e.g. "Mercedes-Benz" also matches "Mercedes", "MB"
  const makeAliases = [makeLower];
  if (makeLower === "mercedes-benz") makeAliases.push("mercedes", "mb ");
  if (makeLower === "volkswagen") makeAliases.push("vw ");
  if (makeLower === "bmw") makeAliases.push("bmw ");
  if (makeLower === "citroën") makeAliases.push("citroen");
  if (makeLower === "škoda") makeAliases.push("skoda");

  // Competitor makes to check against (exclude the searched make)
  const competitors = [...ALL_KNOWN_MAKES]
    .filter((m) => m.toLowerCase() !== makeLower)
    .map((m) => m.toLowerCase());

  return items.filter((item) => {
    const titleLower = item.title.toLowerCase();

    // If title contains searched make → keep
    if (makeAliases.some((alias) => titleLower.includes(alias))) {
      return true;
    }

    // If title contains a competitor make → remove
    if (competitors.some((comp) => titleLower.includes(comp))) {
      return false;
    }

    // Title mentions neither → keep (generic part listing)
    return true;
  });
}

/**
 * Factory code patterns per manufacturer.
 * Regex patterns that match factory codes in listing titles (e.g. W123, E30, 911).
 * Used to detect when a listing is for a DIFFERENT model of the same brand.
 */
const FACTORY_CODE_PATTERNS: Record<string, RegExp> = {
  "Mercedes-Benz": /\b(W|C|S|R|V|A)\d{3}\b/gi,
  BMW: /\b[EFG]\d{2}\b/gi,
  Porsche: /\b(911|912|914|924|928|930|944|964|968|986|987|991|992|993|996|997|356|550|718)\b/g,
  Volkswagen: /\b(T[1-7]|Golf\s*[IV]{1,3}|Käfer|Typ\s*\d{1,2})\b/gi,
  Audi: /\b(B[1-9]|C[1-6]|D[1-4]|4[A-L]|8[A-Z])\b/gi,
  Opel: /\b(Kadett\s*[A-E]|Ascona\s*[A-C]|Manta\s*[A-B]|Rekord\s*[A-E]|GT)\b/gi,
  Fiat: /\b(124|125|126|127|128|130|131|500|600|850|1100|1500|Tipo\s*\d{3})\b/g,
  "Alfa Romeo": /\b(105|115|116|750|101|GTV?|Spider|Giulia|Giulietta)\b/gi,
  Jaguar: /\b(XJ[S6C]?|XK\d{3}|E-Type|Mark\s*[IVX]{1,3}|S-Type)\b/gi,
  Volvo: /\b(P?V?\d{3}|Amazon|PV\d{3}|140|240|740|940|P1800)\b/gi,
};

/**
 * Filter out results that mention a DIFFERENT factory code / model variant
 * from the same manufacturer. E.g. searching for W123, remove results for W124.
 *
 * Logic:
 * - Extract all factory codes mentioned in the result title
 * - If the title mentions our factory code or model → keep
 * - If the title mentions OTHER factory codes from the same brand but NOT ours → remove
 * - If no factory codes detected → keep (generic listing)
 */
function filterByModel(
  items: SearchResultItem[],
  params: SearchParams
): SearchResultItem[] {
  const { make, model, factoryCode } = params;
  const pattern = FACTORY_CODE_PATTERNS[make];

  // If we don't have patterns for this brand, skip model filtering
  if (!pattern) return items;

  // Build a set of "our" identifiers to match against
  const ourIdentifiers = new Set<string>();
  if (factoryCode) ourIdentifiers.add(factoryCode.toLowerCase());
  if (model) ourIdentifiers.add(model.toLowerCase());

  return items.filter((item) => {
    const titleLower = item.title.toLowerCase();

    // Check if our factory code or model appears in the title
    const hasOurModel =
      (factoryCode && titleLower.includes(factoryCode.toLowerCase())) ||
      titleLower.includes(model.toLowerCase());

    if (hasOurModel) return true;

    // Extract factory codes mentioned in this title
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
    const mentionedCodes: string[] = [];
    let match;
    while ((match = pattern.exec(item.title)) !== null) {
      mentionedCodes.push(match[0].toLowerCase());
    }

    // If the title mentions factory codes that aren't ours → wrong model
    if (mentionedCodes.length > 0) {
      const hasMatchingCode = mentionedCodes.some((code) =>
        ourIdentifiers.has(code)
      );
      if (!hasMatchingCode) return false;
    }

    // No factory codes detected → generic listing, keep
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
      _nkw: buildEbayQuery(params),
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

    items = filterByMake(items, params.make);
    items = filterByModel(items, params);
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
      q: buildGoogleQuery(params),
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

    items = filterByMake(items, params.make);
    items = filterByModel(items, params);
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

  items = filterByMake(items, params.make);
  items = filterByModel(items, params);
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

  const partQuery = buildGoogleQuery(params);
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
