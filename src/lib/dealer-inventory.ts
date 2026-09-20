/**
 * Händler-Bestandsübersicht (PROJ-38)
 *
 * Aufbereitung der Daten, die unter /bestand angezeigt werden. Wie beim
 * Werkstatt-Dashboard steht hier kein Datenbankzugriff: Standzeit, Spanne
 * und Sortierung sind prüfbar, ohne ein Fahrzeug anlegen zu müssen.
 *
 * ## Die Spanne ist eine Rohspanne
 *
 * Verkaufserlös minus Einkaufspreis — **ohne** Aufbereitung, Reparaturen,
 * Standkosten. Das ist nicht die Marge, die am Ende verdient ist, und die
 * Anzeige benennt das ausdrücklich. Die Kostendaten dafür lägen mit
 * PROJ-25/26/27 vor; sie einzubeziehen ist ein eigener Schritt und war für
 * diese Fassung ausdrücklich nicht gewollt.
 *
 * ## Nichts wird gerechnet und gespeichert
 *
 * Standzeit und Spanne entstehen bei jeder Anzeige neu. Gespeicherte
 * Rechenergebnisse veralten beim ersten korrigierten Datum — und ein Datum
 * wird oft korrigiert.
 */

import type { Currency } from "@/lib/currency";
import { dayDiff, vehicleLabel } from "@/lib/vehicle-format";

/**
 * Ab wann ein Fahrzeug als Langsteher gilt.
 *
 * Feste Größe, keine Einstellung: Sie betrifft allein die Darstellung und
 * lässt sich jederzeit ändern, ohne gespeicherte Daten anzufassen.
 */
export const LONG_STANDING_DAYS = 180;

/** Ein Fahrzeug, das der Händler aktuell im Bestand hält. */
export interface InventoryVehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  licensePlate: string | null;
  currency: Currency;
  /** Kaufdatum (PROJ-28) oder ersatzweise das Anlagedatum des Fahrzeugs */
  purchasedOn: string | null;
  /** Wahr, wenn ersatzweise das Anlagedatum verwendet wurde */
  purchaseDateEstimated: boolean;
  purchasePriceCents: number | null;
}

/** Herkunft eines abgeschlossenen Vorgangs. */
export type SaleOrigin = "transfer" | "manual";

/**
 * Ein abgeschlossener Verkauf.
 *
 * Bewusst ohne Fahrzeugkennung: Der Vorgang überlebt das Fahrzeug, das nach
 * einer Übergabe beim Käufer liegt oder gelöscht sein kann. Marke, Modell
 * und Baujahr sind eine Abschrift zum Verkaufszeitpunkt, keine Verknüpfung.
 */
export interface SoldRecord {
  id: string;
  make: string;
  model: string;
  year: number | null;
  currency: Currency;
  purchasedOn: string | null;
  purchasePriceCents: number | null;
  soldOn: string;
  salePriceCents: number | null;
  origin: SaleOrigin;
}

export type InventorySort = "standing" | "purchase" | "name";

export const INVENTORY_SORT_LABELS: Record<InventorySort, string> = {
  standing: "Standzeit",
  purchase: "Kaufdatum",
  name: "Fahrzeugname",
};

/**
 * Tage im Bestand. `null`, wenn kein Datum vorliegt.
 *
 * Ein künftiges Kaufdatum ergibt 0 und keine negative Standzeit: „seit −3
 * Tagen im Bestand" ist keine Aussage, die jemand lesen will.
 */
export function standingDays(
  purchasedOn: string | null,
  today: Date
): number | null {
  if (!purchasedOn) return null;
  const tage = dayDiff(purchasedOn, today);
  if (Number.isNaN(tage)) return null;
  return Math.max(0, tage);
}

export function isLongStanding(days: number | null): boolean {
  return days != null && days >= LONG_STANDING_DAYS;
}

/**
 * Standzeit eines abgeschlossenen Vorgangs — eingefroren auf die Spanne
 * zwischen Kauf und Verkauf, nicht bis heute weiterlaufend.
 */
export function soldStandingDays(record: SoldRecord): number | null {
  if (!record.purchasedOn) return null;
  const tage = dayDiff(record.purchasedOn, new Date(`${record.soldOn}T00:00:00Z`));
  if (Number.isNaN(tage)) return null;
  return Math.max(0, tage);
}

/**
 * Rohspanne in Kleinsteinheiten. `null`, wenn einer der beiden Werte fehlt.
 *
 * Es wird **nichts geschätzt**: Ohne Einkaufspreis oder ohne Erlös gibt es
 * keine Spanne, und die Anzeige sagt das, statt eine Null hinzuschreiben.
 */
export function grossMarginCents(record: SoldRecord): number | null {
  if (record.purchasePriceCents == null || record.salePriceCents == null) {
    return null;
  }
  return record.salePriceCents - record.purchasePriceCents;
}

/** Freitextsuche über Marke, Modell und Kennzeichen. */
export function filterInventory(
  vehicles: InventoryVehicle[],
  query: string
): InventoryVehicle[] {
  const q = query.trim().toLowerCase();
  if (!q) return vehicles;

  return vehicles.filter((v) =>
    [v.make, v.model, v.licensePlate ?? ""].join(" ").toLowerCase().includes(q)
  );
}

/**
 * Sortierung der Bestandsliste.
 *
 * Fahrzeuge ohne Kaufdatum landen immer am Ende — ein Fahrzeug ohne Datum
 * ist nicht der älteste Langsteher.
 */
export function sortInventory(
  vehicles: InventoryVehicle[],
  mode: InventorySort
): InventoryVehicle[] {
  const list = [...vehicles];

  if (mode === "name") {
    return list.sort((a, b) =>
      vehicleLabel(a).localeCompare(vehicleLabel(b), "de")
    );
  }

  // Beide übrigen Ordnungen hängen am Kaufdatum: „Standzeit" zeigt das
  // älteste zuerst, „Kaufdatum" das jüngste.
  const richtung = mode === "standing" ? 1 : -1;

  return list.sort((a, b) => {
    if (!a.purchasedOn && !b.purchasedOn) return 0;
    if (!a.purchasedOn) return 1;
    if (!b.purchasedOn) return -1;
    return richtung * a.purchasedOn.localeCompare(b.purchasedOn);
  });
}

export interface CurrencySummary {
  currency: Currency;
  /** Vorgänge mit vollständigen Angaben */
  counted: number;
  /** Vorgänge, bei denen Einkauf oder Erlös fehlt */
  incomplete: number;
  /** Summe der Rohspannen der vollständigen Vorgänge */
  marginCents: number;
}

/**
 * Auswertung der abgeschlossenen Vorgänge, **je Währung getrennt**.
 *
 * Es wird nicht umgerechnet (PROJ-36): Ein Franken-Fahrzeug und ein
 * Euro-Fahrzeug ergeben zwei Zeilen, keine gemeinsame Summe. Und die Zahl
 * der unvollständigen Vorgänge wird mitgeführt, damit die Auswertung sagen
 * kann, worauf sie sich stützt.
 */
export function summarizeSales(records: SoldRecord[]): CurrencySummary[] {
  const proWaehrung = new Map<Currency, CurrencySummary>();

  for (const r of records) {
    const eintrag = proWaehrung.get(r.currency) ?? {
      currency: r.currency,
      counted: 0,
      incomplete: 0,
      marginCents: 0,
    };

    const spanne = grossMarginCents(r);
    if (spanne == null) {
      eintrag.incomplete += 1;
    } else {
      eintrag.counted += 1;
      eintrag.marginCents += spanne;
    }

    proWaehrung.set(r.currency, eintrag);
  }

  return [...proWaehrung.values()].sort((a, b) =>
    a.currency.localeCompare(b.currency)
  );
}

/** „seit 214 Tagen im Bestand" — die Zahl steht als Wort da, nicht nur als Farbe. */
export function formatStandingDays(days: number | null): string {
  if (days == null) return "—";
  if (days === 0) return "heute zugegangen";
  if (days === 1) return "seit 1 Tag im Bestand";
  return `seit ${days} Tagen im Bestand`;
}

/** „214 Tage" — für abgeschlossene Vorgänge, wo die Standzeit feststeht. */
export function formatHoldingDays(days: number | null): string {
  if (days == null) return "—";
  return days === 1 ? "1 Tag" : `${days} Tage`;
}

export interface RemovalWording {
  /** Beschriftung im Menü */
  menuLabel: string;
  /** Überschrift der Sicherheitsabfrage */
  title: string;
  /** Beschriftung der bestätigenden Schaltfläche */
  actionLabel: string;
  /** Meldung nach dem Vollzug */
  successMessage: string;
  /** Ist der Schritt unwiederbringlich? */
  irreversible: boolean;
}

/**
 * Wie das Entfernen eines Vorgangs benannt wird — je nach Herkunft (QA BUG-5).
 *
 * Die Folgen unterscheiden sich fundamental, und die Oberfläche muss das
 * sagen:
 *
 * - **Von Hand gekennzeichnet:** Das Fahrzeug gehört noch dem Händler und
 *   kehrt in den Bestand zurück. Eine echte Rücknahme.
 * - **Aus einer Übergabe:** Der Einkaufspreis wurde beim Annehmen gelöscht
 *   (PROJ-32), das Fahrzeug gehört dem Käufer. Der Vorgang ist die letzte
 *   Aufzeichnung dieses Verkaufs und **nicht wiederherstellbar**.
 *
 * Ein Dialog, der in beiden Fällen „erscheint wieder im Bestand" verspricht,
 * führt genau dort in die Irre, wo es weh tut. Die Entscheidung steht hier
 * und nicht in der Komponente, damit sie ohne Bedienoberfläche prüfbar ist.
 */
export function saleRemovalWording(origin: SaleOrigin): RemovalWording {
  if (origin === "transfer") {
    return {
      menuLabel: "Vorgang löschen",
      title: "Vorgang endgültig löschen?",
      actionLabel: "Endgültig löschen",
      successMessage: "Vorgang gelöscht",
      irreversible: true,
    };
  }

  return {
    menuLabel: "Verkauf zurücknehmen",
    title: "Verkauf zurücknehmen?",
    actionLabel: "Zurücknehmen",
    successMessage:
      "Verkauf zurückgenommen — das Fahrzeug steht wieder im Bestand",
    irreversible: false,
  };
}
