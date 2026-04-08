import {
  ebayKleinanzeigenAdapter,
  googleShoppingAdapter,
} from "./serpapi-adapter";
import type { PlatformAdapter, SearchParams, SearchResultItem } from "./types";
import type { PartGroup, PartsSearchResult } from "@/lib/validations/parts";

const ALL_ADAPTERS: PlatformAdapter[] = [
  ebayKleinanzeigenAdapter,
  googleShoppingAdapter,
];

interface PlatformResult {
  adapterId: string;
  adapterLabel: string;
  items: SearchResultItem[];
  error?: string;
}

/**
 * Search across all (or selected) platform adapters in parallel.
 */
export async function searchParts(
  params: SearchParams,
  platformIds?: string[],
  page = 1,
  pageSize = 20
): Promise<PartsSearchResult> {
  const adapters = platformIds
    ? ALL_ADAPTERS.filter((a) => platformIds.includes(a.id))
    : ALL_ADAPTERS;

  // Run all adapters in parallel with timeout
  const results = await Promise.allSettled(
    adapters.map(async (adapter): Promise<PlatformResult> => {
      try {
        const items = await Promise.race([
          adapter.search(params),
          new Promise<SearchResultItem[]>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 10000)
          ),
        ]);
        return {
          adapterId: adapter.id,
          adapterLabel: adapter.label,
          items,
        };
      } catch (error) {
        return {
          adapterId: adapter.id,
          adapterLabel: adapter.label,
          items: [],
          error:
            error instanceof Error ? error.message : "Unbekannter Fehler",
        };
      }
    })
  );

  // Collect all items and errors
  const allItems: Array<
    SearchResultItem & { platform: string; platformLabel: string }
  > = [];
  const platformErrors: Array<{ platform: string; error: string }> = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      const { adapterId, adapterLabel, items, error } = result.value;
      if (error) {
        platformErrors.push({ platform: adapterLabel, error });
      }
      for (const item of items) {
        allItems.push({ ...item, platform: adapterId, platformLabel: adapterLabel });
      }
    } else {
      platformErrors.push({
        platform: "Unbekannt",
        error: result.reason?.message || "Fehler",
      });
    }
  }

  // Group by title similarity (simple grouping by normalized title)
  const groupMap = new Map<string, PartGroup>();

  for (const item of allItems) {
    // Normalize title for grouping: lowercase, trim, remove extra spaces
    const normalizedTitle = item.title
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);

    const groupKey = normalizedTitle;

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        title: item.title,
        listings: [],
        lowestPrice: null,
      });
    }

    const group = groupMap.get(groupKey)!;
    group.listings.push({
      id: `${item.platform}-${group.listings.length}-${Date.now()}`,
      title: item.title,
      price: item.price,
      currency: item.currency,
      condition: item.condition,
      platform: item.platform as import("@/lib/validations/parts").PlatformId,
      platformLabel: item.platformLabel,
      url: item.url,
      imageUrl: item.imageUrl,
      seller: item.seller,
      foundAt: new Date().toISOString(),
    });

    if (item.price !== null) {
      if (group.lowestPrice === null || item.price < group.lowestPrice) {
        group.lowestPrice = item.price;
      }
    }
  }

  // Sort groups by lowest price, then alphabetically
  const groups = Array.from(groupMap.values()).sort((a, b) => {
    if (a.lowestPrice === null && b.lowestPrice === null) return 0;
    if (a.lowestPrice === null) return 1;
    if (b.lowestPrice === null) return -1;
    return a.lowestPrice - b.lowestPrice;
  });

  // Sort listings within each group by price
  for (const group of groups) {
    group.listings.sort((a, b) => {
      if (a.price === null && b.price === null) return 0;
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return a.price - b.price;
    });
  }

  // Paginate
  const totalResults = groups.reduce((sum, g) => sum + g.listings.length, 0);
  const totalPages = Math.max(1, Math.ceil(groups.length / pageSize));
  const startIdx = (page - 1) * pageSize;
  const pagedGroups = groups.slice(startIdx, startIdx + pageSize);

  return {
    groups: pagedGroups,
    totalResults,
    platformErrors,
    page,
    totalPages,
  };
}

export { ALL_ADAPTERS };
export type { SearchParams, PlatformAdapter };
