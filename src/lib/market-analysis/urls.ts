/**
 * URL-Behandlung für die Marktanalyse (PROJ-29, QA-Runde 1).
 *
 * Zwei Fehler aus dem Live-Lauf haben hier ihre Ursache:
 *
 * BUG-1: Classic Trader liefert dieselbe Anzeige unter /de/, /at/ und /ch/.
 *        Die Entdopplung verglich die volle URL — aus einem Fahrzeug wurden
 *        drei Datenpunkte, einer davon in Schweizer Franken.
 *
 * BUG-3: Eine Suche mit `site:autoscout24.de` lieferte einen Treffer auf
 *        de.wikipedia.org, der als "AutoScout24" etikettiert wurde. Das
 *        Plattformkennzeichen stammte aus der Suchanfrage statt aus der URL.
 */

/** Sprach-/Länderpräfixe, die Classic Trader & Co. der Pfadwurzel voranstellen. */
const LOCALE_SEGMENT = /^(de|at|ch|uk|us|fr|it|es|nl|be|pl|se|dk|no|fi|cz)$/i;

/**
 * Schlüssel, unter dem ein Inserat als "dasselbe Angebot" gilt.
 *
 * Bewusst aggressiver als ein URL-Vergleich: Länderpräfix, Query-Parameter und
 * Fragment fallen weg, und wo die Plattform eine Inserat-ID vergibt, zählt
 * allein diese. eBay hängt an jede URL seitenlange Tracking-Parameter —
 * ohne deren Entfernung ist jede Wiederholung ein neues "Fahrzeug".
 */
export function canonicalListingKey(rawUrl: string): string {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return rawUrl.trim().toLowerCase();
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");

  // eBay: /itm/<id> ist eindeutig, alles andere ist Beiwerk.
  const ebayId = url.pathname.match(/\/itm\/(\d+)/);
  if (ebayId) return `ebay:${ebayId[1]}`;

  // Classic Trader: die letzte Zahl im Pfad ist die Inserat-ID und über alle
  // Länderfassungen hinweg identisch.
  if (host.endsWith("classic-trader.com")) {
    const ctId = url.pathname.match(/\/(\d{4,})\/?$/);
    if (ctId) return `classic-trader:${ctId[1]}`;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length > 0 && LOCALE_SEGMENT.test(segments[0])) segments.shift();

  const basisHost = host.replace(/^(suchen|www\d*)\./, "");
  return `${basisHost}/${segments.join("/")}`.replace(/\/+$/, "").toLowerCase();
}

/**
 * Prüft, ob eine Treffer-URL wirklich zu der Seite gehört, die durchsucht
 * wurde. Google nimmt `site:` als Wunsch, nicht als Bedingung.
 */
export function hostMatchesSite(rawUrl: string, site: string): boolean {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase().replace(/^www\./, "");
    const erwartet = site.toLowerCase().replace(/^www\./, "");
    return host === erwartet || host.endsWith(`.${erwartet}`);
  } catch {
    return false;
  }
}
