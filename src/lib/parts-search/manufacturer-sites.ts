/**
 * Manufacturer-specific specialist shops for classic car parts.
 * Used to build targeted Google Search queries with site: filters.
 */

interface ManufacturerConfig {
  /** Specialist websites for this manufacturer */
  sites: string[];
  /** Alternative search terms for the manufacturer (e.g. abbreviations) */
  aliases?: string[];
}

/**
 * Mapping of vehicle makes to their specialist parts shops.
 * Sites are searched via Google with site: filters for targeted results.
 */
const MANUFACTURER_SITES: Record<string, ManufacturerConfig> = {
  "Mercedes-Benz": {
    sites: [
      "mercedes-benz-classic-store.com",
      "mb-classic-parts.com",
      "sls-parts.de",
      "niemoeller.de",
    ],
    aliases: ["Mercedes", "MB"],
  },
  BMW: {
    sites: [
      "bmw-classic-parts.de",
      "walloth-nesch.de",
      "kfz-teile24.de",
      "hubauer-shop.de",
    ],
  },
  Porsche: {
    sites: [
      "porsche-classic-parts.com",
      "design911.com",
      "stoddard.com",
      "partsklassik.de",
    ],
  },
  Volkswagen: {
    sites: [
      "vw-classic-parts.com",
      "jp-group.com",
      "bus-ok.de",
      "mecatechnic.com",
    ],
    aliases: ["VW"],
  },
  Opel: {
    sites: [
      "opel-classic-parts.com",
      "karosserieteile-opel.de",
      "opelteile.com",
    ],
  },
  Ford: {
    sites: [
      "fordparts-classic.de",
      "motomobil.com",
      "burton-power.com",
    ],
  },
  Fiat: {
    sites: [
      "ricambi-fiat.de",
      "fiat-lancia-club-shop.de",
      "ax-oldtimerteile.de",
    ],
  },
  "Alfa Romeo": {
    sites: [
      "alfa-service.com",
      "ax-oldtimerteile.de",
      "ricambi-fiat.de",
    ],
  },
  Jaguar: {
    sites: [
      "sngbarratt.com",
      "david-manners.co.uk",
      "jaguarclassicparts.com",
    ],
  },
  "Rolls-Royce": {
    sites: [
      "flyingspares.com",
      "introcar.co.uk",
    ],
  },
  Bentley: {
    sites: [
      "flyingspares.com",
      "introcar.co.uk",
    ],
  },
  "Aston Martin": {
    sites: [
      "astonpartsworld.com",
      "aston-martin-heritage.com",
    ],
  },
  Triumph: {
    sites: [
      "moss-europe.co.uk",
      "rimmerbros.com",
      "british-car-parts.de",
    ],
  },
  MG: {
    sites: [
      "moss-europe.co.uk",
      "british-car-parts.de",
      "brown-and-gammons.co.uk",
    ],
  },
  "Austin-Healey": {
    sites: [
      "moss-europe.co.uk",
      "ahspares.co.uk",
    ],
  },
  Lotus: {
    sites: [
      "sj-sportscars.co.uk",
      "deroure.com",
    ],
  },
  "Land Rover": {
    sites: [
      "paddockspares.com",
      "britpart.com",
      "johncraddockltd.co.uk",
    ],
  },
  Citroën: {
    sites: [
      "ds-citroen-ersatzteile.de",
      "2cv-mehari-club.de",
      "franzose.de",
    ],
  },
  Renault: {
    sites: [
      "franzose.de",
      "renault-teile.de",
    ],
  },
  Peugeot: {
    sites: [
      "franzose.de",
      "peugeot-teile24.de",
    ],
  },
  Volvo: {
    sites: [
      "skandix.de",
      "volvoersatzteile.com",
    ],
  },
  Saab: {
    sites: [
      "skandix.de",
      "saab-parts.de",
    ],
  },
  Trabant: {
    sites: [
      "trabantwelt.de",
      "trabiteile.de",
    ],
  },
  Wartburg: {
    sites: [
      "wartburg-teile.de",
      "ifa-teile.de",
    ],
  },
  Audi: {
    sites: [
      "audi-tradition.de",
      "kfz-teile24.de",
    ],
  },
  Ferrari: {
    sites: [
      "superformance.com",
      "eurospares.co.uk",
      "ricambi-ferrari.com",
    ],
  },
  Lamborghini: {
    sites: [
      "superformance.com",
      "eurospares.co.uk",
    ],
  },
  Maserati: {
    sites: [
      "eurospares.co.uk",
      "maserati-alfieri.co.uk",
    ],
  },
  Lancia: {
    sites: [
      "ricambi-fiat.de",
      "ax-oldtimerteile.de",
    ],
  },
};

/** General oldtimer parts shops searched for all manufacturers */
const GENERAL_OLDTIMER_SITES = [
  "classicautoparts.de",
  "oldtimer-teile.com",
  "classic-trader.com",
  "occ.eu",
  "autoteile-meister.de",
];

/**
 * Get specialist sites for a given vehicle make.
 * Returns manufacturer-specific sites plus general oldtimer shops.
 */
export function getSpecialistSites(make: string): string[] {
  const config = MANUFACTURER_SITES[make];
  const manufacturerSites = config?.sites ?? [];
  return [...manufacturerSites, ...GENERAL_OLDTIMER_SITES];
}

/**
 * Build a Google Search site: filter string for OR-ing multiple sites.
 * e.g. "site:shop1.de OR site:shop2.de OR site:shop3.de"
 */
export function buildSiteFilter(sites: string[]): string {
  return sites.map((s) => `site:${s}`).join(" OR ");
}

/**
 * Get display labels for the specialist sites found for a make.
 */
export function getSpecialistLabel(make: string): string {
  const config = MANUFACTURER_SITES[make];
  if (config) {
    return `${make}-Spezialisten`;
  }
  return "Oldtimer-Spezialisten";
}

export { MANUFACTURER_SITES, GENERAL_OLDTIMER_SITES };
