/**
 * Werkstatt-Dashboard (PROJ-37)
 *
 * Aufbereitung der Daten, die unter /werkstatt angezeigt werden. Die Datei
 * enthält bewusst keine Datenbankzugriffe: Was hier steht, ist prüfbar, ohne
 * eine Sitzung, ein Fahrzeug oder eine Mitgliedschaft anlegen zu müssen.
 *
 * ## Zwei Terminquellen, eine Liste
 *
 * Fälligkeiten stammen aus zwei getrennt gewachsenen Stellen: dem Folgetermin
 * an einem Scheckheft-Eintrag (`service_entries.next_due_date`) und den
 * Fahrzeugterminen für TÜV/HU und Service (`vehicle_due_dates`). Für die
 * Werkstatt ist diese Trennung bedeutungslos — sie will wissen, welcher Kunde
 * wann dran ist. Zusammengeführt wird deshalb hier, nicht in der Anzeige.
 *
 * ## Beträge nur vom eigenen Eintrag
 *
 * Die Seite zeigt Geld ausschließlich für Einträge, die der angemeldete
 * Werkstatt-Nutzer selbst angelegt hat (`created_by`). Das ist eine
 * zusätzliche Beschränkung dieser Ansicht, keine Verschärfung des Bestands:
 * Auf der Fahrzeugseite sieht die Werkstatt wie bisher alle Beträge.
 */

import type { Currency } from "@/lib/currency";
import {
  getEntryTypeLabel,
  type ServiceEntryType,
} from "@/lib/validations/service-entry";
import {
  vehicleLabel,
  formatDate,
  formatMileage,
} from "@/lib/vehicle-format";

/** Vorausschau der Terminliste in Tagen. Überfällige sind immer dabei. */
export const DUE_HORIZON_DAYS = 90;

export type DueSource = "service_entry" | "vehicle_due_date";

export interface WorkshopDue {
  vehicleId: string;
  vehicleLabel: string;
  /** Was ansteht — „TÜV/HU", „Inspektion", „Ölwechsel" … */
  label: string;
  /** ISO-Datum (JJJJ-MM-TT) */
  dueDate: string;
  source: DueSource;
}

export interface WorkshopVehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  licensePlate: string | null;
  currency: Currency;
  /** Höchster dokumentierter Kilometerstand, nicht der zuletzt erfasste */
  lastMileageKm: number | null;
  /** Datum des jüngsten Scheckheft-Eintrags, egal von wem */
  lastEntryDate: string | null;
  /** Anzahl der Einträge, die dieser Werkstatt-Nutzer selbst angelegt hat */
  ownEntryCount: number;
  /** Summe der eigenen Einträge in Fahrzeugwährung; null, wenn keiner einen Betrag trägt */
  ownCostCents: number | null;
  /** Nächster offener Termin des Fahrzeugs, auch außerhalb des Vorausschau-Zeitraums */
  nextDue: WorkshopDue | null;
}

export type SortMode = "due" | "name" | "recent";

export const SORT_LABELS: Record<SortMode, string> = {
  due: "Nächste Fälligkeit",
  name: "Fahrzeugname",
  recent: "Letzter Eintrag",
};

/** Beschriftung der Fahrzeugtermine aus `vehicle_due_dates`. */
const DUE_TYPE_LABELS: Record<string, string> = {
  tuv_hu: "TÜV/HU",
  service: "Service",
};

/**
 * Beschriftung eines Termins, je nach Quelle.
 *
 * Die Datenbankfunktion liefert nur den Schlüssel (`entry_type` bzw.
 * `due_type`) und keine fertige Beschriftung: Übersetzt wird an einer Stelle,
 * und das ist die Anzeige. Unbekannte Schlüssel werden durchgereicht statt
 * verschluckt — dann steht im Zweifel „inspection" da und nicht nichts.
 */
export function dueLabel(source: DueSource, labelKey: string): string {
  if (source === "vehicle_due_date") {
    return DUE_TYPE_LABELS[labelKey] ?? labelKey;
  }
  return getEntryTypeLabel(labelKey as ServiceEntryType);
}

// Die drei Anzeigehilfen liegen seit PROJ-38 in lib/vehicle-format.ts, weil
// die Händler-Bestandsübersicht sie ebenfalls braucht. Sie werden hier
// unverändert weitergegeben, damit Tests und Komponenten dieses Bereichs
// ihren gewohnten Zugriff behalten.
export { vehicleLabel, formatDate, formatMileage };

/**
 * Tage bis zum Termin. Negativ heißt überfällig.
 *
 * Gerechnet wird auf Kalendertage in UTC, nicht auf Zeitspannen: Ein Termin,
 * der heute fällig ist, soll 0 ergeben und nicht −0,4, nur weil der Nutzer
 * nachmittags nachsieht.
 */
export function daysUntil(dueDate: string, today: Date): number {
  const due = Date.parse(`${dueDate}T00:00:00Z`);
  if (Number.isNaN(due)) return Number.POSITIVE_INFINITY;
  const start = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  return Math.round((due - start) / 86_400_000);
}

export function isOverdue(dueDate: string, today: Date): boolean {
  return daysUntil(dueDate, today) < 0;
}

/**
 * Die Terminliste der Seite: überfällige zuerst, dann die nächsten 90 Tage.
 *
 * Überfällige werden nicht nach unten begrenzt. Ein Termin, der drei Jahre
 * zurückliegt, ist kein Altdatensatz, den man ausblenden darf — er ist genau
 * die Information, für die es diese Liste gibt.
 */
export function buildDueList(
  dues: WorkshopDue[],
  today: Date,
  horizonDays: number = DUE_HORIZON_DAYS
): WorkshopDue[] {
  // QA BUG-5: Derselbe Termin kann aus beiden Quellen kommen — die HU steht
  // oft sowohl als Folgetermin an einem Scheckheft-Eintrag als auch als
  // Fahrzeugtermin. Zweimal „TÜV/HU · 12.03.2027" untereinander liest sich
  // wie zwei Termine. Zusammengefasst wird über Fahrzeug, Datum und
  // Beschriftung; welche Quelle gewinnt, ist gleichgültig, weil beide
  // dieselbe Aussage tragen.
  const seen = new Set<string>();

  return dues
    .filter((d) => daysUntil(d.dueDate, today) <= horizonDays)
    .filter((d) => {
      const key = `${d.vehicleId}|${d.dueDate}|${d.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) ||
        a.vehicleLabel.localeCompare(b.vehicleLabel, "de")
    );
}

/**
 * Freitextsuche über Marke, Modell und Kennzeichen.
 *
 * Ohne Rücksicht auf Groß- und Kleinschreibung und ohne Leerzeichen an den
 * Rändern — wer „ w123" tippt, meint den W123.
 */
export function filterVehicles(
  vehicles: WorkshopVehicle[],
  query: string
): WorkshopVehicle[] {
  const q = query.trim().toLowerCase();
  if (!q) return vehicles;

  return vehicles.filter((v) =>
    [v.make, v.model, v.licensePlate ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
}

/**
 * Sortierung der Fahrzeugliste.
 *
 * Fahrzeuge ohne den jeweiligen Wert landen immer am Ende, nie zwischen den
 * befüllten: Ein Fahrzeug ohne Termin ist nicht „am dringendsten".
 */
export function sortVehicles(
  vehicles: WorkshopVehicle[],
  mode: SortMode
): WorkshopVehicle[] {
  const list = [...vehicles];

  if (mode === "name") {
    return list.sort((a, b) =>
      vehicleLabel(a).localeCompare(vehicleLabel(b), "de")
    );
  }

  if (mode === "recent") {
    return list.sort((a, b) => {
      if (!a.lastEntryDate && !b.lastEntryDate) return 0;
      if (!a.lastEntryDate) return 1;
      if (!b.lastEntryDate) return -1;
      return b.lastEntryDate.localeCompare(a.lastEntryDate);
    });
  }

  return list.sort((a, b) => {
    if (!a.nextDue && !b.nextDue) return 0;
    if (!a.nextDue) return 1;
    if (!b.nextDue) return -1;
    return a.nextDue.dueDate.localeCompare(b.nextDue.dueDate);
  });
}

/**
 * „seit 12 Tagen überfällig" / „in 34 Tagen" / „heute fällig"
 *
 * Die Überfälligkeit steht als Wort da und nicht nur als rote Farbe — sonst
 * ist sie für Farbfehlsichtige und in Graustufen nicht vorhanden.
 */
export function formatDueDistance(dueDate: string, today: Date): string {
  const days = daysUntil(dueDate, today);
  if (days === 0) return "heute fällig";
  if (days < 0) {
    const n = Math.abs(days);
    return n === 1 ? "seit 1 Tag überfällig" : `seit ${n} Tagen überfällig`;
  }
  return days === 1 ? "in 1 Tag" : `in ${days} Tagen`;
}
