import { describe, it, expect } from "vitest";
import {
  listingSchema,
  publishedPlatformSchema,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  PRICE_TYPES,
  PRICE_TYPE_LABELS,
  LISTING_STATUSES,
  PLATFORM_IDS,
  PLATFORM_STATUSES,
  PLATFORM_INFO,
} from "./listing";

describe("listingSchema", () => {
  it("validates a complete valid listing", () => {
    const result = listingSchema.safeParse({
      title: "Mercedes-Benz 230 E (W123) — Baujahr 1982",
      description: "Zum Verkauf steht ein gepflegter W123.",
      price_cents: 1500000,
      price_type: "festpreis",
      selected_photo_ids: ["id-1", "id-2"],
      photo_order: ["id-2", "id-1"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe(
        "Mercedes-Benz 230 E (W123) — Baujahr 1982"
      );
      expect(result.data.price_cents).toBe(1500000);
      expect(result.data.price_type).toBe("festpreis");
      expect(result.data.selected_photo_ids).toHaveLength(2);
      expect(result.data.photo_order).toHaveLength(2);
    }
  });

  it("requires title", () => {
    const result = listingSchema.safeParse({
      title: "",
      description: "",
      price_cents: null,
      price_type: "verhandlungsbasis",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title longer than max length", () => {
    const result = listingSchema.safeParse({
      title: "A".repeat(TITLE_MAX_LENGTH + 1),
      description: "",
      price_cents: null,
      price_type: "verhandlungsbasis",
    });
    expect(result.success).toBe(false);
  });

  it("accepts title at exactly max length", () => {
    const result = listingSchema.safeParse({
      title: "A".repeat(TITLE_MAX_LENGTH),
      description: "",
      price_cents: null,
      price_type: "verhandlungsbasis",
    });
    expect(result.success).toBe(true);
  });

  it("rejects description longer than max length", () => {
    const result = listingSchema.safeParse({
      title: "Test",
      description: "A".repeat(DESCRIPTION_MAX_LENGTH + 1),
      price_cents: null,
      price_type: "verhandlungsbasis",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null price_cents", () => {
    const result = listingSchema.safeParse({
      title: "Test",
      description: "",
      price_cents: null,
      price_type: "festpreis",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price_cents).toBeNull();
    }
  });

  it("rejects negative price_cents", () => {
    const result = listingSchema.safeParse({
      title: "Test",
      description: "",
      price_cents: -100,
      price_type: "festpreis",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer price_cents", () => {
    const result = listingSchema.safeParse({
      title: "Test",
      description: "",
      price_cents: 15.5,
      price_type: "festpreis",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid price types", () => {
    for (const type of PRICE_TYPES) {
      const result = listingSchema.safeParse({
        title: "Test",
        description: "",
        price_cents: null,
        price_type: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid price type", () => {
    const result = listingSchema.safeParse({
      title: "Test",
      description: "",
      price_cents: null,
      price_type: "auktion",
    });
    expect(result.success).toBe(false);
  });

  it("defaults selected_photo_ids to empty array", () => {
    const result = listingSchema.safeParse({
      title: "Test",
      description: "",
      price_cents: null,
      price_type: "festpreis",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.selected_photo_ids).toEqual([]);
      expect(result.data.photo_order).toEqual([]);
    }
  });
});

describe("constants", () => {
  it("has correct max lengths", () => {
    expect(TITLE_MAX_LENGTH).toBe(70);
    expect(DESCRIPTION_MAX_LENGTH).toBe(5000);
  });

  it("has labels for all price types", () => {
    for (const type of PRICE_TYPES) {
      expect(PRICE_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it("has 2 price types", () => {
    expect(PRICE_TYPES).toHaveLength(2);
  });

  it("has 2 listing statuses", () => {
    expect(LISTING_STATUSES).toHaveLength(2);
  });

  it("has 4 platform IDs", () => {
    expect(PLATFORM_IDS).toHaveLength(4);
    expect(PLATFORM_IDS).toContain("mobile_de");
    expect(PLATFORM_IDS).toContain("kleinanzeigen");
    expect(PLATFORM_IDS).toContain("ebay");
    expect(PLATFORM_IDS).toContain("classic_trader");
  });

  it("has 3 platform statuses", () => {
    expect(PLATFORM_STATUSES).toHaveLength(3);
    expect(PLATFORM_STATUSES).toContain("nicht_veroeffentlicht");
    expect(PLATFORM_STATUSES).toContain("aktiv");
    expect(PLATFORM_STATUSES).toContain("verkauft");
  });

  it("has PLATFORM_INFO for every platform ID", () => {
    for (const id of PLATFORM_IDS) {
      const info = PLATFORM_INFO[id];
      expect(info.name).toBeTruthy();
      expect(info.createUrl).toMatch(/^https:\/\//);
      expect(info.maxPhotos).toBeGreaterThan(0);
      expect(info.maxDescLength).toBeGreaterThan(0);
    }
  });
});

describe("publishedPlatformSchema", () => {
  it("validates a valid platform entry", () => {
    const result = publishedPlatformSchema.safeParse({
      platform: "mobile_de",
      status: "aktiv",
      external_url: "https://www.mobile.de/inserat/123",
      published_at: "2026-04-08T12:00:00Z",
      updated_at: "2026-04-08T12:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("validates entry with null dates", () => {
    const result = publishedPlatformSchema.safeParse({
      platform: "ebay",
      status: "nicht_veroeffentlicht",
      external_url: "",
      published_at: null,
      updated_at: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid platform ID", () => {
    const result = publishedPlatformSchema.safeParse({
      platform: "autoscout24",
      status: "aktiv",
      external_url: "",
      published_at: null,
      updated_at: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = publishedPlatformSchema.safeParse({
      platform: "mobile_de",
      status: "abgelaufen",
      external_url: "",
      published_at: null,
      updated_at: null,
    });
    expect(result.success).toBe(false);
  });

  it("validates all platform and status combinations", () => {
    for (const platform of PLATFORM_IDS) {
      for (const status of PLATFORM_STATUSES) {
        const result = publishedPlatformSchema.safeParse({
          platform,
          status,
          external_url: "",
          published_at: null,
          updated_at: null,
        });
        expect(result.success).toBe(true);
      }
    }
  });
});
