/**
 * Anzeigehilfen rund um Fahrzeuge, die mehr als ein Bereich braucht.
 *
 * Entstanden beim Bau der Händler-Bestandsübersicht (PROJ-38): Drei Helfer
 * aus dem Werkstatt-Dashboard (PROJ-37) wurden dort ein zweites Mal
 * gebraucht. Sie aus dem Werkstatt-Modul zu importieren wäre eine
 * Abhängigkeit zwischen zwei fachlich getrennten Bereichen gewesen —
 * deshalb liegen sie jetzt hier, und beide Bereiche greifen darauf zu.
 *
 * `workshop-dashboard.ts` gibt sie unverändert weiter, damit die dortigen
 * Tests und Komponenten nicht angefasst werden mussten.
 */

/** „Porsche 911 (1973)" — ohne Baujahr, wenn keines erfasst ist. */
export function vehicleLabel(v: {
  make: string;
  model: string;
  year: number | null;
}): string {
  const base = `${v.make} ${v.model}`.trim();
  return v.year ? `${base} (${v.year})` : base;
}

/** „12.3.2026" — leere Werte werden zum Gedankenstrich, nie zu „Invalid Date". */
export function formatDate(value: string | null): string {
  if (!value) return "—";
  const ms = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(ms)) return "—";
  return new Date(ms).toLocaleDateString("de-DE", { timeZone: "UTC" });
}

/** „87.450 km" */
export function formatMileage(km: number | null): string {
  if (km == null) return "—";
  return `${km.toLocaleString("de-DE")} km`;
}

/**
 * Kalendertage zwischen zwei Datumsangaben, in UTC gerechnet.
 *
 * Bewusst auf Kalendertage und nicht auf Zeitspannen: Ein Termin, der heute
 * fällig ist, soll 0 ergeben und nicht −0,4, nur weil nachmittags
 * nachgesehen wird.
 */
export function dayDiff(fromIso: string, to: Date): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  if (Number.isNaN(from)) return Number.NaN;
  const bis = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((bis - from) / 86_400_000);
}
