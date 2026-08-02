/**
 * Klassifikation von Suchtreffern (PROJ-29).
 *
 * Hintergrund: Die Auswertung der gespeicherten Produktionsdaten hat gezeigt,
 * dass die Mehrheit der bisher als "Inserat" gezählten Treffer gar kein
 * Fahrzeug ist. Bei einem Mercedes-Benz 220 waren von 60 Treffern
 *
 *   - 27 Suchergebnis- bzw. Übersichtsseiten ("264 Mercedes-Benz 220
 *     Limousine Gebrauchtwagen", Preis 2.108 €),
 *   -  7 Ersatzteile,
 *   - 26 mögliche echte Fahrzeuge.
 *
 * Die Übersichtsseiten sind der größte Einzelposten und zugleich der Grund für
 * die absurden Preisspannen: ihr "Preis" ist ein Ab-Preis oder ein Mittelwert
 * über hunderte fremder Fahrzeuge. Sie lassen sich NICHT über
 * Fahrzeugmerkmale aussortieren, denn sie nennen durchaus Jahreszahlen
 * ("10 gebrauchte Mercedes-Benz 220 aus dem Jahr 1960"). Deshalb ist die URL
 * das führende Signal — sie ist plattformseitig vergeben und nicht geraten.
 */

/**
 * URL-Muster, die eine Detailseite (genau ein Fahrzeug) kennzeichnen.
 * Aus den Produktionsdaten abgeleitet: Classic Trader nutzt /inserat/,
 * eBay /itm/.
 */
const DETAILSEITEN_MUSTER = [
  /\/inserat\//i,
  /\/itm\//i,
  /\/fahrzeuge\/details\//i,
  /\/angebot(?:e)?\/\d/i,
  /\/classified\//i,
  /\/vehicle\/\d/i,
];

/**
 * URL-Muster, die eine Suchergebnis-, Marken- oder Modellübersichtsseite
 * kennzeichnen. `suchen.mobile.de` ist ein Sonderfall: in den Produktionsdaten
 * lagen ALLE 141 mobile.de-Treffer auf dieser Subdomain, also ausnahmslos auf
 * Suchseiten — von mobile.de kam über Google keine einzige Detailseite.
 */
const SUCHSEITEN_MUSTER = [
  /^https?:\/\/suchen\.mobile\.de/i,
  /\/suche\//i,
  /\/search\//i,
  /\/lst(?:\/|$)/i, // AutoScout24-Listenseiten
  /\/sch\//i, // eBay-Suchseiten
  /\/gebrauchtwagen(?:\/|$)/i,
  /\/autos\/[a-z-]+(?:\/|$)(?!.*\d{6})/i,
  /[?&](?:q|search|sort|page|pageNumber)=/i,
  // AutoScout24-Modellseiten: /auto/mercedes-benz/mercedes-benz-220/
  // Redaktionelle Übersicht ("Infos, Preise, Alternativen"), kein Inserat.
  // Detailseiten tragen dort eine lange ID, die dieses Muster nicht trifft.
  /\/auto\/[a-z0-9-]+\/[a-z0-9-]+\/?(?:$|\?)/i,
];

/**
 * Titelmuster für Übersichtsseiten. Nur als Rückfallebene gedacht, wenn die URL
 * kein eindeutiges Signal liefert — Titel sind unzuverlässiger, weil
 * Detailseiten bei Classic Trader mit "Zu Verkaufen:" beginnen und dieselben
 * Wörter enthalten können.
 */
const UEBERSICHT_TITELMUSTER = [
  /^\s*\d{1,5}\s+\S/, // "264 Mercedes-Benz 220 Limousine Gebrauchtwagen"
  /\b\d{1,5}\s+(?:gebrauchte|gebrauchtwagen|angebote|inserate|treffer|ergebnisse|fahrzeuge|autos|oldtimer)\b/i,
  /\bgebrauchtwagen\b.*\bkaufen\b/i,
  /\bkaufen\s+bei\s+(?:mobile|autoscout|classic)/i,
  /\bjetzt\s+(?:g(?:ü|ue)nstig\s+)?online\s+kaufen\b/i,
  /\bneu-?\s*und\s*gebrauchtwagen\b/i,
  /\balle\s+angebote\b/i,
];

export type Trefferart = "detailseite" | "uebersichtsseite" | "unbekannt";

/**
 * Bestimmt, ob ein Treffer ein einzelnes Fahrzeug oder eine Übersichtsseite ist.
 *
 * Reihenfolge ist bewusst: Ein Detailseiten-Muster in der URL schlägt jedes
 * Titelsignal. Sonst würde "Zu Verkaufen: Mercedes-Benz 220 Cabriolet A (1952)"
 * unter /inserat/ an einem Titelmuster hängenbleiben.
 */
export function classifyResultPage(url: string, title: string = ""): Trefferart {
  if (DETAILSEITEN_MUSTER.some((m) => m.test(url))) return "detailseite";
  if (SUCHSEITEN_MUSTER.some((m) => m.test(url))) return "uebersichtsseite";
  if (UEBERSICHT_TITELMUSTER.some((m) => m.test(title))) return "uebersichtsseite";
  return "unbekannt";
}

/**
 * Kurzform für die Filterkette.
 */
export function isAggregatePage(url: string, title: string = ""): boolean {
  return classifyResultPage(url, title) === "uebersichtsseite";
}

/**
 * Merkmale, die ein konkretes Fahrzeug beschreiben (Tech Design C2).
 *
 * Ein echtes Inserat nennt mindestens eines davon: Baujahr, Laufleistung,
 * Leistung oder Hubraum. Fehlen alle vier, ist der Treffer nicht als
 * Vergleichsfahrzeug belastbar — unabhängig davon, ob ein Preis dabeisteht.
 */
export interface Fahrzeugmerkmale {
  baujahr: number | null;
  laufleistungKm: number | null;
  leistungPs: number | null;
  hubraumCcm: number | null;
}

export function extractVehicleAttributes(
  title: string,
  snippet: string = ""
): Fahrzeugmerkmale {
  const text = `${title} ${snippet}`;

  // Baujahr: bevorzugt in Klammern "(1951)", sonst frei stehend.
  // Obergrenze bewusst dynamisch, damit die Prüfung nicht mit der Zeit veraltet.
  const maxJahr = new Date().getUTCFullYear() + 1;
  let baujahr: number | null = null;
  const klammerJahr = text.match(/\((1[89]\d{2}|20\d{2})\)/);
  if (klammerJahr) {
    baujahr = Number(klammerJahr[1]);
  } else {
    const freiesJahr = text.match(/\b(1[89]\d{2}|20[0-2]\d)\b/);
    if (freiesJahr) baujahr = Number(freiesJahr[1]);
  }
  if (baujahr !== null && (baujahr < 1886 || baujahr > maxJahr)) baujahr = null;

  const kmTreffer = text.match(/\b(\d{1,3}(?:[.\s]\d{3})+|\d{2,7})\s*km\b/i);
  let laufleistungKm: number | null = null;
  if (kmTreffer) {
    const wert = Number(kmTreffer[1].replace(/[.\s]/g, ""));
    if (Number.isFinite(wert) && wert > 0 && wert <= 2_000_000) laufleistungKm = wert;
  }

  const psTreffer = text.match(/\b(\d{2,4})\s*(?:PS|kW)\b/i);
  let leistungPs: number | null = null;
  if (psTreffer) {
    const wert = Number(psTreffer[1]);
    if (wert >= 5 && wert <= 2000) leistungPs = wert;
  }

  const ccmTreffer = text.match(/\b(\d{3,5})\s*(?:ccm|cm³|cm3)\b/i);
  let hubraumCcm: number | null = null;
  if (ccmTreffer) {
    const wert = Number(ccmTreffer[1]);
    if (wert >= 50 && wert <= 20000) hubraumCcm = wert;
  }

  return { baujahr, laufleistungKm, leistungPs, hubraumCcm };
}

/**
 * Ob der Treffer genug Fahrzeugmerkmale trägt, um als Vergleichsfahrzeug zu
 * zählen. Ein einzelnes Merkmal genügt — Oldtimer-Inserate nennen oft nur das
 * Baujahr und verschweigen die Laufleistung.
 */
export function hasVehicleAttributes(title: string, snippet: string = ""): boolean {
  const m = extractVehicleAttributes(title, snippet);
  return (
    m.baujahr !== null ||
    m.laufleistungKm !== null ||
    m.leistungPs !== null ||
    m.hubraumCcm !== null
  );
}

/** Grund, aus dem ein Treffer verworfen wurde — für die Transparenzanzeige. */
export type Ablehnungsgrund =
  | "ersatzteil"
  | "uebersichtsseite"
  | "keine_fahrzeugmerkmale"
  | "falsche_marke"
  | "falscher_typcode"
  | "kein_preis"
  | "preis_unplausibel"
  // BUG-9: "preis_unplausibel" war mit Abstand der häufigste Grund, meinte
  // aber überwiegend billige eBay-Teile. Für eine Transparenzanzeige ist das
  // irreführend, deshalb getrennt ausgewiesen.
  | "preis_zu_niedrig"
  // BUG-2
  | "fremdwaehrung"
  // BUG-3: Treffer, den Google trotz `site:`-Einschränkung geliefert hat
  | "fremde_seite"
  // BUG-1
  | "doppelt";

export const ABLEHNUNGSGRUND_LABELS: Record<Ablehnungsgrund, string> = {
  ersatzteil: "Ersatzteil oder Zubehör",
  uebersichtsseite: "Suchergebnis- statt Fahrzeugseite",
  keine_fahrzeugmerkmale: "Keine Fahrzeugdaten erkennbar",
  falsche_marke: "Andere Marke",
  falscher_typcode: "Andere Baureihe",
  kein_preis: "Kein Preis angegeben",
  preis_unplausibel: "Preis unplausibel",
  preis_zu_niedrig: "Preis zu niedrig für ein Fahrzeug",
  fremdwaehrung: "Preis nicht in Euro",
  fremde_seite: "Treffer außerhalb der durchsuchten Plattform",
  doppelt: "Dasselbe Inserat mehrfach gefunden",
};
