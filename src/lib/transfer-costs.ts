/**
 * Kostendaten beim Fahrzeug-Transfer (PROJ-32).
 *
 * Beim Besitzerwechsel gilt eine Trennung, die sich durch den ganzen
 * Kostenbereich zieht: **Wartungs- und Verbrauchshistorie ist Fahrzeugwissen**
 * und geht mit über, **Beträge sind persönliche Finanzdaten** und bleiben beim
 * bisherigen Besitzer. Ein Scheckheft-Eintrag „Vergaser überholt, 82.000 km"
 * wandert also mit — die 1.240 € daneben nicht.
 *
 * Diese Datei liefert die beiden Bausteine, die der Vorbesitzer **vor** dem
 * Transfer braucht: die Anzahlen für den Hinweis und die Tabelle zum Sichern.
 * Das Entfernen selbst geschieht beim Annehmen in der Datenbank.
 */

/** Trennzeichen und Kodierung so, dass deutsches Excel die Datei direkt öffnet */
const TRENNZEICHEN = ";";

/**
 * Byte Order Mark.
 *
 * Ohne diese drei Bytes am Dateianfang liest Excel die Datei in der
 * Windows-Zeichentabelle: Aus „Anhängerkupplung" wird „AnhÃ¤ngerkupplung".
 * Der Nutzer sieht dann Zeichensalat und hat keine Möglichkeit, das zu deuten.
 */
const BOM = "﻿";

/** Die Bestände, die beim Annehmen des Transfers verschwinden */
export interface CostStock {
  /** Kaufpreis erfasst (samt Nebenkosten) */
  hasPurchase: boolean;
  /** Anzahl der Kauf-Nebenkosten */
  purchaseExtras: number;
  recurring: number;
  oneOff: number;
  /** Selbst eingetragene Marktwerte (PROJ-28) */
  marketValues: number;
  /**
   * Marktpreis-Analysen (PROJ-11), QA BUG-1.
   *
   * Ihre Zugriffsregel hing am Fahrzeug, nicht am Nutzer — mit dem
   * Besitzerwechsel wanderte der Zugriff mit, und der Käufer sah die
   * Preisempfehlungen des Verkäufers. Sie werden deshalb mitgelöscht, wie der
   * selbst eingetragene Marktwert auch.
   */
  marketAnalyses: number;
  /** Scheckheft-Einträge **mit** Betrag — nur deren Betrag wird geleert */
  serviceWithCost: number;
  /** Tankvorgänge **mit** Betrag — nur deren Betrag wird geleert */
  fuelWithCost: number;
}

export const LEERER_BESTAND: CostStock = {
  hasPurchase: false,
  purchaseExtras: 0,
  recurring: 0,
  oneOff: 0,
  marketValues: 0,
  marketAnalyses: 0,
  serviceWithCost: 0,
  fuelWithCost: 0,
};

/**
 * Gibt es überhaupt etwas zu verlieren?
 *
 * Bei einem Fahrzeug ohne jede Kostenerfassung darf der Hinweis gar nicht
 * erscheinen — er würde einen Verlust ankündigen, den es nicht gibt (F2).
 */
export function hasAnything(stock: CostStock): boolean {
  return (
    stock.hasPurchase ||
    stock.purchaseExtras > 0 ||
    stock.recurring > 0 ||
    stock.oneOff > 0 ||
    stock.marketValues > 0 ||
    stock.marketAnalyses > 0 ||
    stock.serviceWithCost > 0 ||
    stock.fuelWithCost > 0
  );
}

/** Ein Posten des Hinweises: was verschwindet, in welcher Menge, und wie */
export interface StockItem {
  label: string;
  /** true: die Zeile bleibt, nur der Betrag geht (Scheckheft, Tankbuch) */
  onlyAmount: boolean;
}

/**
 * Die Aufzählung für den Hinweis — mit echten Anzahlen.
 *
 * „14 laufende Kosten, 23 Einzelkosten" wirkt ungleich stärker als „deine
 * Kostendaten" (F1). Leere Bestände erscheinen nicht: Wer nie getankt hat,
 * braucht keine Zeile über Tankbelege.
 */
export function describeStock(stock: CostStock): StockItem[] {
  const items: StockItem[] = [];

  if (stock.hasPurchase) {
    items.push({
      label:
        stock.purchaseExtras > 0
          ? `Kaufpreis und ${anzahl(stock.purchaseExtras, "Nebenkosten-Posten", "Nebenkosten-Posten")}`
          : "Kaufpreis",
      onlyAmount: false,
    });
  }
  if (stock.marketValues > 0) {
    items.push({
      label: anzahl(stock.marketValues, "eingetragener Marktwert", "eingetragene Marktwerte"),
      onlyAmount: false,
    });
  }
  if (stock.marketAnalyses > 0) {
    items.push({
      label: anzahl(stock.marketAnalyses, "Marktpreis-Analyse", "Marktpreis-Analysen"),
      onlyAmount: false,
    });
  }
  if (stock.recurring > 0) {
    items.push({
      label: anzahl(stock.recurring, "laufende Kostenposition", "laufende Kostenpositionen"),
      onlyAmount: false,
    });
  }
  if (stock.oneOff > 0) {
    items.push({
      label: anzahl(stock.oneOff, "Einzelkosten-Eintrag", "Einzelkosten-Einträge"),
      onlyAmount: false,
    });
  }
  if (stock.serviceWithCost > 0) {
    items.push({
      label: `Beträge aus ${anzahl(stock.serviceWithCost, "Scheckheft-Eintrag", "Scheckheft-Einträgen")}`,
      onlyAmount: true,
    });
  }
  if (stock.fuelWithCost > 0) {
    items.push({
      label: `Beträge aus ${anzahl(stock.fuelWithCost, "Tankvorgang", "Tankvorgängen")}`,
      onlyAmount: true,
    });
  }

  return items;
}

function anzahl(n: number, einzahl: string, mehrzahl: string): string {
  return `${n} ${n === 1 ? einzahl : mehrzahl}`;
}

/** Eine Zeile der Export-Tabelle */
export interface CsvRow {
  bereich: string;
  /** ISO-Datum oder leer, wenn der Posten keines hat */
  datum: string;
  bezeichnung: string;
  amountCents: number;
  anmerkung?: string;
}

const KOPFZEILE = ["Bereich", "Datum", "Bezeichnung", "Betrag (EUR)", "Anmerkung"];

/**
 * Baut die CSV-Tabelle.
 *
 * Drei Entscheidungen, die darüber bestimmen, ob die Datei beim Nutzer
 * aufgeht oder als Zeichensalat in einer einzigen Spalte landet:
 *
 * - **Semikolon** statt Komma — deutsches Excel erwartet das, weil das Komma
 *   hier das Dezimalzeichen ist
 * - **Dezimalkomma ohne Tausenderpunkt und ohne Währungszeichen** — so liest
 *   Excel eine Zahl und keinen Text. „1.240,00 €" wäre Text und ließe sich
 *   nicht summieren, was den Zweck des Exports verfehlt
 * - **BOM** am Anfang, sonst zerfallen die Umlaute
 */
export function buildCostCsv(rows: CsvRow[]): string {
  const zeilen = [
    KOPFZEILE.join(TRENNZEICHEN),
    ...rows.map((r) =>
      [
        r.bereich,
        formatDatum(r.datum),
        r.bezeichnung,
        formatBetrag(r.amountCents),
        r.anmerkung ?? "",
      ]
        .map(maskiere)
        .join(TRENNZEICHEN)
    ),
  ];
  // \r\n, weil Excel unter Windows sonst alles in eine Zeile zieht
  return BOM + zeilen.join("\r\n") + "\r\n";
}

/** ISO-Datum zu TT.MM.JJJJ; leere Angabe bleibt leer */
export function formatDatum(iso: string): string {
  if (!iso) return "";
  const [jahr, monat, tag] = iso.slice(0, 10).split("-");
  if (!jahr || !monat || !tag) return iso;
  return `${tag}.${monat}.${jahr}`;
}

/** Cent zu „1240,00" — Dezimalkomma, kein Tausenderpunkt, keine Währung */
function formatBetrag(cents: number): string {
  const vorzeichen = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${vorzeichen}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")}`;
}

/**
 * Maskiert ein Feld nach RFC 4180.
 *
 * Nötig, sobald Trennzeichen, Anführungszeichen oder Zeilenumbruch im Text
 * stehen — und das kommt vor: Notizen enthalten Semikolons, Werkstattnamen
 * Anführungszeichen. Ohne Maskierung verrutscht ab dort die ganze Tabelle.
 */
function maskiere(feld: string): string {
  const text = feld ?? "";
  if (
    text.includes(TRENNZEICHEN) ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Dateiname mit Fahrzeug und Datum, ohne Zeichen, die Dateisysteme stören */
export function exportFilename(vehicleName: string, today: Date): string {
  const sauber = vehicleName
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const datum = today.toISOString().slice(0, 10);
  return `Kostendaten-${sauber || "Fahrzeug"}-${datum}.csv`;
}
