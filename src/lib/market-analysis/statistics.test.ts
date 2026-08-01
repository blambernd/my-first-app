import { describe, it, expect } from "vitest";
import { calculatePriceStatistics, MIN_PRICED_LISTINGS } from "./statistics";
import type { MarketListing } from "./types";

function makeListing(price: number | null, platform = "mobile.de"): MarketListing {
  return {
    title: `Test Listing ${price}`,
    price,
    platform,
    url: `https://example.com/${price}-${Math.random()}`,
  };
}

function makeListings(prices: Array<number | null>): MarketListing[] {
  return prices.map((p) => makeListing(p));
}

describe("calculatePriceStatistics", () => {
  it("returns null below the minimum sample size", () => {
    expect(calculatePriceStatistics([])).toBeNull();
    expect(calculatePriceStatistics([makeListing(10000)])).toBeNull();

    // Genau einer zu wenig
    const tooFew = makeListings(
      Array.from({ length: MIN_PRICED_LISTINGS - 1 }, (_, i) => 20000 + i * 100)
    );
    expect(calculatePriceStatistics(tooFew)).toBeNull();
  });

  it("returns statistics at exactly the minimum sample size", () => {
    const listings = makeListings(
      Array.from({ length: MIN_PRICED_LISTINGS }, (_, i) => 20000 + i * 100)
    );
    const stats = calculatePriceStatistics(listings)!;

    expect(stats).not.toBeNull();
    expect(stats.count).toBe(MIN_PRICED_LISTINGS);
  });

  it("does not count null-priced listings toward the minimum", () => {
    const listings = makeListings([
      ...Array.from({ length: MIN_PRICED_LISTINGS - 1 }, () => 20000),
      null,
      null,
      null,
    ]);
    expect(calculatePriceStatistics(listings)).toBeNull();
  });

  it("calculates correct basic statistics", () => {
    const listings = makeListings([
      16000, 18000, 20000, 22000, 24000, 26000, 28000, 30000,
    ]);
    const stats = calculatePriceStatistics(listings)!;

    expect(stats.count).toBe(8);
    expect(stats.average).toBe(23000);
    expect(stats.median).toBe(23000);
    expect(stats.lowest).toBe(16000);
    expect(stats.highest).toBe(30000);
  });

  it("calculates median correctly for an even number of listings", () => {
    const listings = makeListings([
      20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000,
    ]);
    const stats = calculatePriceStatistics(listings)!;

    expect(stats.median).toBe(37500);
    expect(stats.count).toBe(8);
  });

  it("marks extreme values as outliers using the IQR method", () => {
    const listings = makeListings([
      18000, 19000, 20000, 20500, 21000, 21500, 22000, 23000,
      100000, // Ausreißer
    ]);
    const stats = calculatePriceStatistics(listings)!;

    const outliers = stats.listingsWithOutliers.filter((l) => l.is_outlier);
    expect(outliers.some((l) => l.price === 100000)).toBe(true);
  });

  it("generates a recommendation within the non-outlier range", () => {
    const listings = makeListings([
      15000, 16000, 18000, 20000, 22000, 23000, 24000, 25000,
    ]);
    const stats = calculatePriceStatistics(listings)!;

    expect(stats.recommendedLow).toBeGreaterThanOrEqual(15000);
    expect(stats.recommendedHigh).toBeLessThanOrEqual(25000);
    expect(stats.recommendedLow).toBeLessThan(stats.recommendedHigh);
  });

  it("includes null-priced listings in the output but never counts them", () => {
    const listings = makeListings([
      16000, 18000, 20000, 22000, 24000, 26000, 28000, 30000, null,
    ]);
    const stats = calculatePriceStatistics(listings)!;

    expect(stats.count).toBe(8);
    expect(stats.listingsWithOutliers).toHaveLength(9);

    const nullListing = stats.listingsWithOutliers.find((l) => l.price === null);
    expect(nullListing?.is_outlier).toBe(false);
  });

  it("generates German-language reasoning", () => {
    const listings = makeListings([
      16000, 18000, 20000, 22000, 24000, 26000, 28000, 30000,
    ]);
    const stats = calculatePriceStatistics(listings)!;

    expect(stats.reasoning).toContain("Basierend auf");
    expect(stats.reasoning).toContain("Medianpreis");
    expect(stats.reasoning).toContain("€");
  });

  it("points out that the basis is asking prices, not achieved prices", () => {
    const listings = makeListings([
      16000, 18000, 20000, 22000, 24000, 26000, 28000, 30000,
    ]);
    const stats = calculatePriceStatistics(listings)!;

    expect(stats.reasoning).toContain("Angebotspreise");
  });

  it("mentions a large price spread in the reasoning", () => {
    const listings = makeListings([
      8000, 20000, 21000, 22000, 23000, 24000, 25000, 26000, 150000,
    ]);
    const stats = calculatePriceStatistics(listings)!;

    expect(stats.reasoning).toContain("unterschiedliche Fahrzeugzustände");
  });

  it("handles all identical prices", () => {
    const listings = makeListings(Array.from({ length: 8 }, () => 20000));
    const stats = calculatePriceStatistics(listings)!;

    expect(stats.average).toBe(20000);
    expect(stats.median).toBe(20000);
    expect(stats.recommendedLow).toBeLessThanOrEqual(20000);
    expect(stats.recommendedHigh).toBeGreaterThanOrEqual(20000);
  });

  describe("relative price floor", () => {
    it("excludes spare-part prices far below the median from the calculation", () => {
      // Acht Fahrzeuge plus vier Teile-Treffer, wie sie in der Produktion
      // tatsächlich in die Berechnung geraten sind.
      const listings = makeListings([
        18000, 19000, 20000, 21000, 22000, 23000, 24000, 25000,
        600, 650, 690, 700,
      ]);
      const stats = calculatePriceStatistics(listings)!;

      expect(stats.count).toBe(8);
      expect(stats.lowest).toBe(18000);
      expect(stats.median).toBeGreaterThan(18000);
    });

    it("still reports the excluded listings, marked as outliers", () => {
      const listings = makeListings([
        18000, 19000, 20000, 21000, 22000, 23000, 24000, 25000,
        600, 650, 690, 700,
      ]);
      const stats = calculatePriceStatistics(listings)!;

      expect(stats.listingsWithOutliers).toHaveLength(12);
      const cheap = stats.listingsWithOutliers.filter(
        (l) => l.price !== null && l.price < 1000
      );
      expect(cheap).toHaveLength(4);
      expect(cheap.every((l) => l.is_outlier)).toBe(true);
    });

    it("returns null when too few plausible listings remain after filtering", () => {
      // Vier Fahrzeuge, vier Teile — die Mindestzahl wird erst durch den
      // Schrott erreicht und darf deshalb nicht ausreichen.
      const listings = makeListings([
        18000, 19000, 20000, 21000,
        600, 650, 690, 700,
      ]);
      expect(calculatePriceStatistics(listings)).toBeNull();
    });
  });
});
