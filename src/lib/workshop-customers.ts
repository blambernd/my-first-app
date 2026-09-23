import type { SupabaseClient } from "@supabase/supabase-js";
import { vehicleLabel } from "@/lib/vehicle-format";

/**
 * Kundenfahrzeuge einer Werkstatt (PROJ-39).
 *
 * Das sind Fahrzeuge, bei denen die Werkstatt **selbst Besitzer** ist —
 * anders als die betreuten Fahrzeuge aus PROJ-37, die ihr ein Besitzer per
 * Einladung überlassen hat. Der Unterschied ist nicht kosmetisch: Hier
 * greifen die gewöhnlichen Zugriffsregeln, es braucht keine Funktion mit
 * erhöhten Rechten. Deshalb wird die Abfrage aus PROJ-37 dafür auch nicht
 * erweitert, sondern diese hier danebengestellt.
 */
export interface CustomerVehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  licensePlate: string | null;
  mileageKm: number | null;
  createdAt: string;
  /** Hinterlegte Kundenangabe — nur für die Werkstatt sichtbar */
  customer: CustomerNote | null;
  /** Laufende Übergabe, falls eine offen ist (PROJ-40) */
  uebergabe: OffeneUebergabe | null;
}

export interface CustomerNote {
  name: string | null;
  phone: string | null;
  email: string | null;
}

/**
 * Eine laufende Übergabe an einem Kundenfahrzeug (PROJ-40).
 *
 * Nur der jüngste offene Vorgang je Fahrzeug — mehr als einen kann es
 * nicht geben, dafür sorgt eine Eindeutigkeitsregel in der Datenbank.
 */
export interface OffeneUebergabe {
  toEmail: string;
  expiresAt: string;
  /**
   * Abgelaufen, obwohl in der Datenbank noch „offen"?
   *
   * Der Status wechselt erst, wenn jemand die Übergabe anzunehmen versucht
   * — bis dahin steht eine längst verfallene Einladung weiter auf „offen".
   * Wer allein dem Status glaubt, zeigt der Werkstatt eine Übergabe als
   * laufend an, die niemand mehr annehmen kann.
   */
  abgelaufen: boolean;
}

/** Wie viele Fahrzeuge höchstens geladen werden. */
const MAX_VEHICLES = 200;

/**
 * Lädt die eigenen Fahrzeuge der Werkstatt samt Kundenangabe.
 *
 * ## Solange die Kundentabelle fehlt
 *
 * Die Kundenangaben liegen in einer eigenen Tabelle, die der Backend-Schritt
 * anlegt. Bis dahin — und bei jedem späteren Fehler — kommen die Fahrzeuge
 * ohne Kundenangabe zurück, statt dass die Seite scheitert. Die Angabe ist
 * eine Hilfe beim Wiederfinden, nicht der Inhalt der Liste.
 *
 * ## Warum die Kundenangaben nicht am Fahrzeug stehen
 *
 * Alles, was an `vehicles` steht, können auch die Mitglieder des Fahrzeugs
 * lesen — Betrachter, eingeladene Werkstätten und nach einer Übergabe der
 * neue Besitzer. Der Kundenname darf das nicht. Eine getrennte Tabelle mit
 * der Regel „nur der Besitzer" ist die einzige Bauweise, die diese Zusage
 * einhält.
 */
export async function getCustomerVehicles(
  supabase: SupabaseClient,
  userId: string
): Promise<CustomerVehicle[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, make, model, year, license_plate, mileage_km, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_VEHICLES);

  if (error) {
    console.error("Customer vehicles query failed:", error.message);
    return [];
  }

  const vehicles = data ?? [];
  if (vehicles.length === 0) return [];

  const ids = vehicles.map((v) => v.id as string);
  const [notes, uebergaben] = await Promise.all([
    getCustomerNotes(supabase, ids),
    getOffeneUebergaben(supabase, ids),
  ]);

  return vehicles.map((v) => ({
    id: v.id as string,
    make: v.make as string,
    model: v.model as string,
    year: (v.year as number | null) ?? null,
    licensePlate: (v.license_plate as string | null) ?? null,
    mileageKm: (v.mileage_km as number | null) ?? null,
    createdAt: v.created_at as string,
    customer: notes.get(v.id as string) ?? null,
    uebergabe: uebergaben.get(v.id as string) ?? null,
  }));
}

/**
 * Laufende Übergaben zu mehreren Fahrzeugen; bei Fehlern leer.
 *
 * In **einer** Abfrage für alle Fahrzeuge. Die vorhandene Funktion
 * `get_vehicle_transfers` beantwortet dieselbe Frage, aber je Fahrzeug —
 * bei sechzig Kundenfahrzeugen wären das sechzig Aufrufe. Die Werkstatt ist
 * hier Besitzerin, die gewöhnliche Zugriffsregel genügt.
 */
async function getOffeneUebergaben(
  supabase: SupabaseClient,
  vehicleIds: string[]
): Promise<Map<string, OffeneUebergabe>> {
  const map = new Map<string, OffeneUebergabe>();

  const { data, error } = await supabase
    .from("vehicle_transfers")
    .select("vehicle_id, to_email, expires_at")
    .in("vehicle_id", vehicleIds)
    .eq("status", "offen");

  if (error) {
    // Die Kennzeichnung ist Beiwerk der Liste, nicht ihr Inhalt.
    console.error("Open transfers query failed:", error.message);
    return map;
  }

  const jetzt = Date.now();

  for (const row of data ?? []) {
    const expiresAt = row.expires_at as string;
    map.set(row.vehicle_id as string, {
      toEmail: row.to_email as string,
      expiresAt,
      abgelaufen: Date.parse(expiresAt) < jetzt,
    });
  }

  return map;
}

/** Ein anstehender Termin an einem eigenen Kundenfahrzeug (PROJ-39). */
export interface EigenerTermin {
  vehicleId: string;
  /** Der Schlüssel, aus dem die Beschriftung entsteht */
  labelKey: string;
  /** ISO-Datum (JJJJ-MM-TT) */
  dueDate: string;
  source: "service_entry" | "vehicle_due_date";
}

/**
 * Anstehende Termine an den eigenen Kundenfahrzeugen.
 *
 * ## Warum das hier noch einmal steht
 *
 * Die Terminliste des Werkstattbereichs speiste sich ausschließlich aus
 * `get_workshop_dashboard()` — und die Funktion kennt nur **betreute**
 * Fahrzeuge. Eigene Kundenfahrzeuge lieferten dadurch keine Termine, und
 * bei einer Werkstatt ohne Einladung blieb die Karte „Anstehende Arbeiten"
 * dauerhaft leer. Das Akzeptanzkriterium verlangt beide Gruppen.
 *
 * Dieselben zwei Quellen wie dort: ein Scheckheft-Eintrag mit
 * Wiedervorlage und ein eigens gepflegter Fahrzeugtermin. Sie sind
 * getrennt gewachsen und ergeben für die Werkstatt eine Liste.
 *
 * Hier genügen die gewöhnlichen Zugriffsregeln — die Werkstatt ist
 * Besitzerin dieser Fahrzeuge.
 */
export async function getEigeneTermine(
  supabase: SupabaseClient,
  vehicleIds: string[]
): Promise<EigenerTermin[]> {
  if (vehicleIds.length === 0) return [];

  const [ausEintraegen, ausTerminen] = await Promise.all([
    supabase
      .from("service_entries")
      .select("vehicle_id, entry_type, next_due_date")
      .in("vehicle_id", vehicleIds)
      .not("next_due_date", "is", null),
    supabase
      .from("vehicle_due_dates")
      .select("vehicle_id, due_type, due_date")
      .in("vehicle_id", vehicleIds),
  ]);

  const termine: EigenerTermin[] = [];

  if (ausEintraegen.error) {
    console.error("Own service dues query failed:", ausEintraegen.error.message);
  } else {
    for (const r of ausEintraegen.data ?? []) {
      termine.push({
        vehicleId: r.vehicle_id as string,
        labelKey: r.entry_type as string,
        dueDate: r.next_due_date as string,
        source: "service_entry",
      });
    }
  }

  if (ausTerminen.error) {
    console.error("Own due dates query failed:", ausTerminen.error.message);
  } else {
    for (const r of ausTerminen.data ?? []) {
      termine.push({
        vehicleId: r.vehicle_id as string,
        labelKey: r.due_type as string,
        dueDate: r.due_date as string,
        source: "vehicle_due_date",
      });
    }
  }

  // Eine fehlgeschlagene Quelle nimmt der Liste ihre Einträge, nicht ihre
  // Existenz: Die übrigen Termine bleiben sichtbar.
  return termine;
}

/**
 * Wie eine laufende Übergabe in der Liste beschrieben wird.
 *
 * Das Ablaufdatum kommt aus der Übergabe selbst und wird **nicht** aus einer
 * Frist gerechnet: Die Spezifikation nannte sieben Tage, das Formular setzt
 * vierzehn. Wer die Frist nachrechnet, zeigt früher oder später ein Datum
 * an, das nicht stimmt.
 */
export function uebergabeText(u: OffeneUebergabe): {
  kennzeichen: string;
  erklaerung: string;
} {
  const datum = new Date(u.expiresAt).toLocaleDateString("de-DE");

  if (u.abgelaufen) {
    return {
      kennzeichen: "Übergabe abgelaufen",
      erklaerung: `Die Einladung an ${u.toEmail} ist am ${datum} verfallen. Das Fahrzeug gehört weiterhin dir.`,
    };
  }

  return {
    kennzeichen: "Übergabe offen",
    erklaerung: `Warte auf ${u.toEmail} — die Einladung gilt bis ${datum}.`,
  };
}

/** Kundenangaben zu mehreren Fahrzeugen; bei Fehlern leer. */
async function getCustomerNotes(
  supabase: SupabaseClient,
  vehicleIds: string[]
): Promise<Map<string, CustomerNote>> {
  const map = new Map<string, CustomerNote>();

  const { data, error } = await supabase
    .from("vehicle_customers")
    .select("vehicle_id, customer_name, customer_phone, customer_email")
    .in("vehicle_id", vehicleIds);

  if (error) {
    // Erwartet, solange die Tabelle fehlt. Die Liste bleibt benutzbar.
    console.error("Customer notes query failed:", error.message);
    return map;
  }

  for (const row of data ?? []) {
    map.set(row.vehicle_id as string, {
      name: (row.customer_name as string | null) ?? null,
      phone: (row.customer_phone as string | null) ?? null,
      email: (row.customer_email as string | null) ?? null,
    });
  }

  return map;
}

/**
 * Was in der Liste als Kunde erscheint.
 *
 * Fällt auf die Telefonnummer und dann die E-Mail zurück, wenn kein Name
 * hinterlegt ist: Irgendeine Zuordnung ist nützlicher als eine leere Spalte,
 * und wer nur die Nummer notiert hat, hat sie als Merkhilfe notiert.
 */
export function customerLabel(customer: CustomerNote | null): string | null {
  if (!customer) return null;
  return customer.name || customer.phone || customer.email || null;
}

/** Durchsucht Fahrzeug- und Kundenangaben. */
export function filterCustomerVehicles(
  vehicles: CustomerVehicle[],
  query: string
): CustomerVehicle[] {
  const q = query.trim().toLowerCase();
  if (!q) return vehicles;

  return vehicles.filter((v) => {
    const felder = [
      vehicleLabel({ make: v.make, model: v.model, year: v.year }),
      v.licensePlate ?? "",
      v.customer?.name ?? "",
      v.customer?.phone ?? "",
      v.customer?.email ?? "",
    ];
    return felder.some((f) => f.toLowerCase().includes(q));
  });
}
