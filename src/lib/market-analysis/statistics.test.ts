import { describe, it, expect } from "vitest";
import { calculatePriceStatistics } from "./statistics";
import type { MarketListing } from "./types";

function makeListing(price: number | null, platform = "mobile.de"): MarketListing {
  return {
    title: `Test Listing ${price}`,
    price,
    platform,
    url: `https://example.com/${price}`,
  };
}

describe("calculatePriceStatistics", () => {
  it("returns null when fewer than 3 priced listings", () => {
    expect(calculatePriceStatistics([])).toBeNull();
    expect(calculatePriceStatistics([makeListing(10000)])).toBeNull();
    expect(
      calculatePriceStatistics([makeListing(10000), makeListing(20000)])
    ).toBeNull();
  });

  it("returns null when fewer than 3 listings have valid prices (rest are null)", () => {
    const listings = [
      makeListing(10000),
      makeListing(null),
      makeListing(20000),
      makeListing(null),
    ];
    expect(calculatePriceStatistics(listings)).toBeNull();
  });

  it("calculates correct statistics for 3 listings", () => {
    const listings = [
      makeListing(10000),
      makeListing(20000),
      makeListing(30000),
    ];
    const stats = calculatePriceStatistics(listings)!;

    expect(stats).not.toBeNull();
    expect(stats.count).toBe(3);
    expect(stats.average).toBe(20000);
    expect(stats.median).toBe(20000);
    expect(stats.lowest).toBe(10000);
    expect(stats.highest).toBe(30000);
  });

  it("calculates median correctly for even number of listings", () => {
    const listings = [
      makeListing(10000),
      makeListing(20000),
      makeListing(30000),
      makeListing(40000),
    ];
    const stats = calculatePriceStatistics(listings)!;

    expect(stats.median).toBe(25000);
    expect(stats.count).toBe(4);
  });

  it("marks outliers using IQR method", () => {
    // Tight cluster of 5 + one extreme outlier
    const listings = [
      makeListing(18000),
      makeListing(20000),
      makeListing(21000),
      makeListing(22000),
      makeListing(23000),
      makeListing(100000), // outlier
    ];
    const stats = calculatePriceStatistics(listings)!;

    expect(stats).not.toBeNull();
    const outliers = stats.listingsWithOutliers.filter((l) => l.is_outlier);
    expect(outliers.length).toBeGreaterThanOrEqual(1);
    expect(outliers.some((l) => l.price === 100000)).toBe(true);
  });

  it("generates recommendation within non-outlier range", () => {
    const listings = [
      makeListing(15000),
      makeListing(18000),
      makeListing(20000),
      makeListing(22000),
      makeListing(25000),
    ];
    const stats = calculatePriceStatistics(listings)!;

    expect(stats.recommendedLow).toBeGreaterThanOrEqual(15000);
    expect(stats.recommendedHigh).toBeLessThanOrEqual(25000);
    expect(stats.recommendedLow).toBeLessThan(stats.recommendedHigh);
  });

  it("includes listings with null prices in output (not counted)", () => {
    const listings = [
      makeListing(10000),
      makeListing(null),
      makeListing(20000),
      makeListing(30000),
    ];
    const stats = calculatePriceStatistics(listings)!;

    expect(stats.count).toBe(3); // only priced ones counted
    expect(stats.listingsWithOutliers).toHaveLength(4); // all listings included
  });

  it("null-priced listings are never marked as outliers", () => {
    const listings = [
      makeListing(10000),
      makeListing(null),
      makeListing(20000),
      makeListing(30000),
    ];
    const stats = calculatePriceStatistics(listings)!;
    const nullListing = stats.listingsWithOutliers.find((l) => l.price === null);
    expect(nullListing?.is_outlier).toBe(false);
  });

  it("generates German-language reasoning text", () => {
    const listings = [
      makeListing(15000),
      makeListing(20000),
      makeListing(25000),
    ];
    const stats = calculatePriceStatistics(listings)!;

    expect(stats.reasoning).toContain("Basierend auf");
    expect(stats.reasoning).toContain("Medianpreis");
    expect(stats.reasoning).toContain("€");
  });

  it("mentions large price spread in reasoning", () => {
    // Huge spread: lowest to highest > 2x median
    const listings = [
      makeListing(5000),
      makeListing(20000),
      makeListing(25000),
      makeListing(30000),
      makeListing(150000),
    ];
    const stats = calculatePriceStatistics(listings)!;

    expect(stats.reasoning).toContain("unterschiedliche Fahrzeugzustände");
  });

  it("handles all identical prices", () => {
    const listings = [
      makeListing(20000),
      makeListing(20000),
      makeListing(20000),
    ];
    const stats = calculatePriceStatistics(listings)!;

    expect(stats.average).toBe(20000);
    expect(stats.median).toBe(20000);
    expect(stats.lowest).toBe(20000);
    expect(stats.highest).toBe(20000);
    // With 5% spread fallback
    expect(stats.recommendedLow).toBeLessThanOrEqual(20000);
    expect(stats.recommendedHigh).toBeGreaterThanOrEqual(20000);
  });
});
