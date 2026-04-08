/**
 * Pure filtering and parsing functions for market analysis.
 * Separated from search.ts to allow unit testing without serpapi dependency.
 */

/**
 * Keywords that indicate a listing is for spare parts, not a whole vehicle.
 * Case-insensitive matching against title + snippet.
 */
const SPARE_PARTS_KEYWORDS = [
  "ersatzteil", "ersatzteile",
  "motorhaube", "stoßstange", "stossstange",
  "kotflügel", "kotfluegel",
  "scheinwerfer", "rücklicht", "ruecklicht",
  "türgriff", "tuergriff",
  "spiegel", "außenspiegel", "aussenspiegel",
  "felge", "felgen",
  "auspuff", "endschalldämpfer",
  "bremsscheibe", "bremsbelag", "bremssattel",
  "kühler", "kuehler", "kühlergrill",
  "anlasser", "lichtmaschine", "generator",
  "vergaser", "einspritzpumpe",
  "getriebe", "schaltgetriebe", "automatikgetriebe",
  "zylinderkopf", "kurbelwelle", "nockenwelle",
  "dichtung", "dichtungssatz",
  "zündkerze", "zuendkerze", "zündverteiler",
  "ölfilter", "oelfilter", "luftfilter",
  "kupplung", "kupplungsscheibe",
  "radlager", "traggelenk", "spurstange",
  "windschutzscheibe", "heckscheibe", "seitenscheibe",
  "innenausstattung", "sitzbezug", "lenkrad",
  "tacho", "instrument", "kombiinstrument",
  "teilekatalog", "werkstatthandbuch", "reparaturanleitung",
  "modell 1:18", "modellauto", "modell 1:43",
  "schlüsselanhänger", "poster", "prospekt",
  "miniatur", "diecast",
];

/**
 * Check if a listing title/snippet indicates spare parts rather than a whole vehicle.
 */
export function isSparePartListing(title: string, snippet: string = ""): boolean {
  const combined = (title + " " + snippet).toLowerCase();

  for (const keyword of SPARE_PARTS_KEYWORDS) {
    if (combined.includes(keyword)) return true;
  }

  // Pattern: "für [Make]" or "passend für" — typically parts listings
  if (/\bfür\s+(mercedes|bmw|porsche|volkswagen|vw|opel|ford|audi)\b/i.test(combined)) {
    return true;
  }

  return false;
}

/**
 * Parse a price from text (German format: "25.000 €", "25000€", "EUR 25.000").
 * Returns null if no price found or price is implausible.
 */
export function parsePrice(text: string): number | null {
  const patterns = [
    /(\d{1,3}(?:\.\d{3})+)\s*€/,
    /€\s*(\d{1,3}(?:\.\d{3})+)/,
    /EUR\s*(\d{1,3}(?:\.\d{3})+)/,
    /(\d{4,7})\s*€/,
    /€\s*(\d{4,7})/,
    /EUR\s*(\d{4,7})/,
    /Preis[:\s]*(\d{1,3}(?:\.\d{3})+)/i,
    /VB\s*(\d{1,3}(?:\.\d{3})+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const priceStr = match[1].replace(/\./g, "");
      const price = parseInt(priceStr, 10);
      if (!isNaN(price) && price >= 1000 && price <= 5_000_000) {
        return price;
      }
    }
  }
  return null;
}

/**
 * Validate that an extracted price is plausible for a vehicle listing.
 * Catches common mis-extractions like phone numbers, years, or mileage.
 */
export function isPricePlausible(price: number, title: string, snippet: string = ""): boolean {
  const combined = (title + " " + snippet).toLowerCase();

  // Reject if the price looks like a year (1886-2030)
  if (price >= 1886 && price <= 2030) return false;

  // Reject if price looks like mileage (often "123.000 km")
  const kmPattern = new RegExp(`${price.toLocaleString("de-DE")}\\s*km`, "i");
  if (kmPattern.test(combined)) return false;

  // Reject very round numbers in realistic mileage range (50k-500k km)
  // but only if the number actually appears in the text without € context
  if (price % 10000 === 0 && price >= 50000 && price <= 500000) {
    const priceStr = price.toLocaleString("de-DE");
    const appearsInText = combined.includes(priceStr) || combined.includes(String(price));
    if (appearsInText) {
      const hasEuroContext = new RegExp(`${priceStr}\\s*€|€\\s*${priceStr}|EUR\\s*${priceStr}`, "i").test(combined);
      if (!hasEuroContext) return false;
    }
  }

  return true;
}
