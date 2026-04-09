/**
 * PLZ geocoding and Haversine distance calculation for German postal codes.
 * Data covers all ~8,200 German 5-digit PLZ areas.
 */

interface PlzCoordinates {
  lat: number;
  lng: number;
}

// Lazy-loaded PLZ data
let plzData: Record<string, PlzCoordinates> | null = null;

async function loadPlzData(): Promise<Record<string, PlzCoordinates>> {
  if (plzData) return plzData;
  const data = await import("@/data/plz-coordinates.json");
  plzData = data.default as Record<string, PlzCoordinates>;
  return plzData;
}

/**
 * Look up coordinates for a German PLZ (5-digit postal code).
 */
export async function getPlzCoordinates(
  plz: string
): Promise<PlzCoordinates | null> {
  const data = await loadPlzData();
  return data[plz] ?? null;
}

/**
 * Haversine formula: Calculate distance between two points on Earth in km.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
