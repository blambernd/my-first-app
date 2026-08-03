import type { CostAnalysis, CategoryResult } from "@/lib/cost-analysis";

/**
 * Die Kennzahlen des Kostenüberblicks (PROJ-31).
 *
 * Rechnet **nichts neu**: Alle Beträge kommen aus derselben Auswertung, die
 * auch der Analysebereich verwendet. Diese Datei fasst sie nur zu den vier
 * Zahlen zusammen, die die Einstiegsseite beantwortet — und entscheidet, wann
 * eine Zahl lieber entfällt, als zu raten.
 */

/** Ab diesem Anteil gilt ein einzelner Posten als beherrschend */
export const DOMINANT_SHARE = 0.5;

export interface OverviewGroup {
  key: string;
  label: string;
  totalCents: number;
  /** Anteil an den Gesamtkosten, 0–1 */
  share: number;
  /** Pfad des zugehörigen Detailbereichs, angehängt an /vehicles/[id] */
  path: string;
}

export interface CostOverview {
  totalCents: number;
  /** Durchschnitt je Monat im tatsächlich abgedeckten Zeitraum */
  perMonthCents: number;
  /** Gefahrene Kilometer, oder null wenn nicht ermittelbar */
  km: number | null;
  /**
   * Kosten je Kilometer in Cent, oder null.
   *
   * Entfällt ohne verwertbare Fahrleistung. Ein aus einem einzigen
   * Kilometerstand hochgerechneter Wert sähe plausibel aus und wäre falsch.
   */
  perKmCents: number | null;
  /** Warum die Kosten je Kilometer entfallen — für die Begründung am Platz */
  perKmMissingReason: "keine-messpunkte" | "widerspruechliche-staende" | null;
  groups: OverviewGroup[];
  /** Keinerlei Kosten im Zeitraum erfasst */
  isEmpty: boolean;
  /**
   * Ein einzelner Posten macht mehr als die Hälfte aus.
   *
   * Eine Restaurierung über 15.000 € lässt zwölf Monate teuer aussehen; der
   * Monatsdurchschnitt ist dann kein Erwartungswert für den nächsten Monat.
   */
  dominantGroup: OverviewGroup | null;
  /** Nur eine einzige Kostenart erfasst — eine Verteilung wäre keine */
  singleSource: boolean;
  /**
   * Gruppen, für die nie etwas erfasst wurde (QA BUG-2).
   *
   * Bewusst in **derselben** Gruppierung wie die Aufteilung. Zuvor nannte der
   * Hinweis die feinen Kategorien der Auswertung, während die Darstellung sie
   * zusammenfasste — die Seite zeigte dann „Wartung & Reparatur 15.000 €" und
   * gleichzeitig „Für Wartung wurde nichts erfasst". Beides stimmte, gelesen
   * ergab es einen Widerspruch.
   *
   * Eine Gruppe gilt nur als unerfasst, wenn **keine** ihrer Kostenarten je
   * erfasst wurde.
   */
  untrackedGroups: string[];
}

/**
 * Ordnet die Kostenarten den vier Gruppen des Überblicks zu.
 *
 * Gröber als die Kategorien der Auswertung: Der Überblick beantwortet „wo
 * lohnt der genauere Blick", nicht „was genau war es". Jede Gruppe führt in
 * den Bereich, in dem sich die Einträge bearbeiten lassen.
 */
const GROUPS: Array<{ key: string; label: string; path: string; categories: string[] }> = [
  { key: "fuel", label: "Kraftstoff", path: "/tankbuch", categories: ["fuel"] },
  {
    key: "service",
    label: "Wartung & Reparatur",
    path: "/scheckheft",
    categories: ["maintenance", "repair"],
  },
  {
    key: "recurring",
    label: "Laufende Kosten",
    path: "/kosten/laufende",
    categories: ["insurance", "tax", "storage", "club"],
  },
  {
    key: "oneoff",
    label: "Einzelkosten",
    path: "/kosten/einzelkosten",
    categories: ["parts", "appraisal", "misc"],
  },
];

export function buildCostOverview(
  analysis: CostAnalysis,
  monthsCovered: number
): CostOverview {
  const byKey = new Map<string, CategoryResult>();
  for (const c of analysis.categories) byKey.set(c.key, c);

  const roh = GROUPS.map((g) => ({
    key: g.key,
    label: g.label,
    path: g.path,
    totalCents: g.categories.reduce(
      (sum, k) => sum + (byKey.get(k)?.totalCents ?? 0),
      0
    ),
  }));

  const totalCents = roh.reduce((s, g) => s + g.totalCents, 0);
  const mitBetrag = roh.filter((g) => g.totalCents > 0);

  const groups: OverviewGroup[] = mitBetrag.map((g) => ({
    ...g,
    share: totalCents > 0 ? g.totalCents / totalCents : 0,
  }));

  // Der Durchschnitt teilt durch die **abgedeckten** Monate, nicht durch 12.
  // Bei einem im Mai gekauften Fahrzeug wäre sonst jeder Monat um zwei
  // Drittel zu billig.
  const perMonthCents =
    monthsCovered > 0 ? Math.round(totalCents / monthsCovered) : 0;

  const km = analysis.mileage.km;
  let perKmCents: number | null = null;
  let perKmMissingReason: CostOverview["perKmMissingReason"] = null;

  if (km !== null && km > 0) {
    perKmCents = Math.round(totalCents / km);
  } else if (analysis.mileage.readings < 2) {
    perKmMissingReason = "keine-messpunkte";
  } else {
    // Zwei oder mehr Stände, aber keine verwertbare Strecke: Tachotausch,
    // Tippfehler oder rückläufige Werte. Eine negative Fahrleistung darf
    // nicht zu negativen Kosten je Kilometer führen.
    perKmMissingReason = "widerspruechliche-staende";
  }

  const dominant = groups.find((g) => g.share > DOMINANT_SHARE) ?? null;

  // Eine Gruppe ist unerfasst, wenn keine ihrer Kostenarten je erfasst wurde.
  // `tracked` bezieht sich auf **alle** Daten, nicht nur den Zeitraum — wer
  // Tankbelege von 2023 hat, hat die Art sehr wohl erfasst.
  const untrackedGroups = GROUPS.filter((g) =>
    g.categories.every((k) => byKey.get(k)?.tracked === false)
  ).map((g) => g.label);

  return {
    totalCents,
    perMonthCents,
    km,
    perKmCents,
    perKmMissingReason,
    groups,
    isEmpty: totalCents === 0,
    // Ein beherrschender Posten ist nur dann eine Warnung wert, wenn es
    // überhaupt etwas zu verzerren gibt — bei einer einzigen Quelle ist der
    // Anteil trivialerweise 100 %.
    dominantGroup: groups.length > 1 ? dominant : null,
    singleSource: groups.length === 1,
    untrackedGroups,
  };
}
