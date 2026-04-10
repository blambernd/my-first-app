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
  "bremsscheibe", "bremsbelag", "bremssattel",
  "anlasser", "lichtmaschine",
  "einspritzpumpe",
  "zylinderkopf", "kurbelwelle", "nockenwelle",
  "dichtungssatz",
  "zündkerze", "zuendkerze", "zündverteiler",
  "ölfilter", "oelfilter", "luftfilter",
  "kupplungsscheibe",
  "radlager", "traggelenk", "spurstange",
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
 * Check if a listing matches the expected factory code (Werksbezeichnung).
 * E.g. for a W123, reject listings that mention W124, W126, etc.
 *
 * Returns true if the listing is relevant (matches or doesn't mention a conflicting code).
 */
export function matchesFactoryCode(
  title: string,
  snippet: string,
  factoryCode: string
): boolean {
  const combined = (title + " " + snippet).toLowerCase();
  const code = factoryCode.toLowerCase();

  // If the factory code appears in the listing → relevant
  if (combined.includes(code)) return true;

  // Extract the letter prefix and numeric part from the factory code
  // Covers patterns like W123, R107, C107, E30, E36, etc.
  const codeMatch = factoryCode.match(/^([A-Za-z]+)[\s-]?(\d+)$/);
  if (!codeMatch) return true; // Can't parse → don't filter

  const [, prefix, number] = codeMatch;
  const prefixLower = prefix.toLowerCase();

  // Look for codes with the SAME prefix but different number (e.g. W124 when searching W123)
  const samePrefixPattern = new RegExp(
    `\\b${prefixLower}[\\s-]?(\\d+)\\b`,
    "gi"
  );
  let match: RegExpExecArray | null;

  while ((match = samePrefixPattern.exec(combined)) !== null) {
    if (match[1] !== number) return false; // Different code, same prefix → reject
  }

  // Also look for any letter+number factory code pattern in the text
  // If the listing mentions a different factory code entirely (e.g. R107 when searching C107),
  // and our code is NOT mentioned, it's probably a different vehicle
  const anyCodePattern = /\b([A-Za-z])\s?(\d{2,3})\b/g;
  let hasOtherCode = false;

  while ((match = anyCodePattern.exec(combined)) !== null) {
    const foundCode = (match[1] + match[2]).toLowerCase();
    if (foundCode === code) return true; // Our code found → definitely relevant
    // Only flag as conflict if the found code looks like a chassis code
    // (single letter + 2-3 digits, like W123, E30, R107)
    if (match[1].match(/[wercstWERCST]/i)) {
      hasOtherCode = true;
    }
  }

  // If other chassis codes found but not ours → likely wrong vehicle
  if (hasOtherCode) return false;

  return true;
}

/**
 * Extract price from SerpAPI rich_snippet or structured data.
 * SerpAPI may return price info in rich_snippet.top.detected_extensions,
 * rich_snippet.top.extensions, or other structured fields.
 */
export function extractRichSnippetPrice(item: Record<string, unknown>): number | null {
  // Check rich_snippet.top.detected_extensions.price
  const richSnippet = item.rich_snippet as Record<string, unknown> | undefined;
  if (richSnippet?.top) {
    const top = richSnippet.top as Record<string, unknown>;
    const detected = top.detected_extensions as Record<string, unknown> | undefined;
    if (detected?.price) {
      const price = Number(detected.price);
      if (!isNaN(price) && price >= 1000 && price <= 5_000_000) return price;
    }
    // Check extensions array for price strings
    const extensions = top.extensions as string[] | undefined;
    if (extensions) {
      for (const ext of extensions) {
        const price = parsePrice(ext);
        if (price !== null) return price;
      }
    }
  }

  // Check displayed_link or other fields that might contain price
  const richSnippetBottom = richSnippet?.bottom as Record<string, unknown> | undefined;
  if (richSnippetBottom?.extensions) {
    const extensions = richSnippetBottom.extensions as string[];
    for (const ext of extensions) {
      const price = parsePrice(ext);
      if (price !== null) return price;
    }
  }

  // SerpAPI sometimes includes price in a top-level "price" field
  if (item.price) {
    const priceStr = String(item.price);
    const price = parsePrice(priceStr);
    if (price !== null) return price;
  }

  return null;
}

/**
 * Parse a price from text (German format: "25.000 €", "25000€", "EUR 25.000").
 * Returns null if no price found or price is implausible.
 */
export function parsePrice(text: string): number | null {
  // Patterns with dot as thousands separator (German: "25.900")
  const dotThousands = [
    /(\d{1,3}(?:\.\d{3})+),\d{2}\s*€/,           // "25.900,00 €"
    /(\d{1,3}(?:\.\d{3})+)\s*[,\-]*\s*€/,         // "25.900 €", "25.900,-€"
    /€\s*(\d{1,3}(?:\.\d{3})+)/,                   // "€ 25.900"
    /EUR\s*(\d{1,3}(?:\.\d{3})+)/i,                // "EUR 25.900"
    /Preis[:\s]*(\d{1,3}(?:\.\d{3})+)/i,           // "Preis: 25.900"
    /VB\s*(\d{1,3}(?:\.\d{3})+)/i,                 // "VB 25.900"
    /VHB\s*(\d{1,3}(?:\.\d{3})+)/i,                // "VHB 25.900"
    /(\d{1,3}(?:\.\d{3})+)\s*(?:VB|VHB)/i,         // "25.900 VB"
    /(\d{1,3}(?:\.\d{3})+)\s*,-/,                   // "25.900,-"
    /(\d{1,3}(?:\.\d{3})+)\s*,\s*-\s*€/,           // "25.900, - €"
    /ab\s*(\d{1,3}(?:\.\d{3})+)\b/i,               // "ab 25.900"
    /for\s*€?\s*(\d{1,3}(?:\.\d{3})+)/i,           // "for €25.900"
  ];

  for (const pattern of dotThousands) {
    const match = text.match(pattern);
    if (match) {
      const priceStr = match[1].replace(/\./g, "");
      const price = parseInt(priceStr, 10);
      if (!isNaN(price) && price >= 1000 && price <= 5_000_000) {
        return price;
      }
    }
  }

  // Plain number patterns (no thousands separator: "25900")
  const plainPatterns = [
    /(\d{4,7})\s*[,\-]*\s*€/,
    /€\s*(\d{4,7})/,
    /EUR\s*(\d{4,7})/,
    /Preis[:\s]*(\d{4,7})(?!\s*km)/i,
    /(\d{4,7})\s*(?:VB|VHB)/i,
  ];

  for (const pattern of plainPatterns) {
    const match = text.match(pattern);
    if (match) {
      const price = parseInt(match[1], 10);
      if (!isNaN(price) && price >= 1000 && price <= 5_000_000) {
        return price;
      }
    }
  }

  // Space as thousands separator ("25 900 €")
  const spacePattern = /(\d{1,3}(?:\s\d{3})+)\s*€/;
  const spaceMatch = text.match(spacePattern);
  if (spaceMatch) {
    const price = parseInt(spaceMatch[1].replace(/\s/g, ""), 10);
    if (!isNaN(price) && price >= 1000 && price <= 5_000_000) {
      return price;
    }
  }

  // Fallback: dot-separated number NOT followed by "km" (e.g. "25.900" standalone)
  const fallbackDot = /\b(\d{1,3}(?:\.\d{3})+)\b/g;
  let fallbackMatch: RegExpExecArray | null;
  while ((fallbackMatch = fallbackDot.exec(text)) !== null) {
    // Skip if followed by "km"
    const after = text.slice(fallbackMatch.index + fallbackMatch[0].length, fallbackMatch.index + fallbackMatch[0].length + 5);
    if (/^\s*km/i.test(after)) continue;
    const priceStr = fallbackMatch[1].replace(/\./g, "");
    const price = parseInt(priceStr, 10);
    if (!isNaN(price) && price >= 2000 && price <= 5_000_000) {
      return price;
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
