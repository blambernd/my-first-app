import { describe, it, expect } from "vitest";
import { haversineDistance, getPlzCoordinates } from "./geo";

describe("haversineDistance", () => {
  it("returns 0 for same point", () => {
    expect(haversineDistance(52.52, 13.405, 52.52, 13.405)).toBe(0);
  });

  it("calculates Berlin to Munich (~504 km)", () => {
    const dist = haversineDistance(52.52, 13.405, 48.1351, 11.582);
    expect(dist).toBeGreaterThan(490);
    expect(dist).toBeLessThan(520);
  });

  it("calculates Hamburg to Frankfurt (~392 km)", () => {
    const dist = haversineDistance(53.5511, 9.9937, 50.1109, 8.6821);
    expect(dist).toBeGreaterThan(380);
    expect(dist).toBeLessThan(410);
  });

  it("calculates short distance Köln to Bonn (~25 km)", () => {
    const dist = haversineDistance(50.9375, 6.9603, 50.7374, 7.0982);
    expect(dist).toBeGreaterThan(20);
    expect(dist).toBeLessThan(30);
  });
});

describe("getPlzCoordinates", () => {
  it("returns coordinates for Berlin 10115", async () => {
    const coords = await getPlzCoordinates("10115");
    expect(coords).not.toBeNull();
    expect(coords!.lat).toBeCloseTo(52.52, 1);
    expect(coords!.lng).toBeCloseTo(13.405, 1);
  });

  it("returns coordinates for München 80331", async () => {
    const coords = await getPlzCoordinates("80331");
    expect(coords).not.toBeNull();
    expect(coords!.lat).toBeCloseTo(48.135, 1);
    expect(coords!.lng).toBeCloseTo(11.582, 1);
  });

  it("returns null for non-existent PLZ", async () => {
    const coords = await getPlzCoordinates("99999");
    expect(coords).toBeNull();
  });

  it("returns null for invalid input", async () => {
    const coords = await getPlzCoordinates("abc");
    expect(coords).toBeNull();
  });
});
