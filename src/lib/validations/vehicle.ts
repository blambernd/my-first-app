import { z } from "zod";
import { CURRENCIES, DEFAULT_CURRENCY, type Currency } from "@/lib/currency";

const currentYear = new Date().getFullYear();

/**
 * Zustandsnote nach der im Oldtimer-Markt üblichen Skala 1–5.
 *
 * Sie ist die Bezugsgröße, ohne die ein Marktvergleich beliebig wird: Ohne
 * Note wird ein gepflegtes Fahrzeug mit Scheunenfunden in einen Topf geworfen.
 * Die Erläuterungen stehen bewusst hier und nicht im Formular — sie gehören
 * zur Bedeutung der Note, nicht zu ihrer Darstellung.
 */
export const CONDITION_GRADES = [
  {
    value: 1,
    label: "Note 1 — makellos",
    description: "Concours-Zustand, besser als ab Werk",
  },
  {
    value: 2,
    label: "Note 2 — guter gepflegter Zustand",
    description: "Keine Mängel, nur leichte Gebrauchsspuren",
  },
  {
    value: 3,
    label: "Note 3 — gebraucht, fahrbereit",
    description: "Kleinere Mängel, aber ohne sofortigen Handlungsbedarf",
  },
  {
    value: 4,
    label: "Note 4 — verbraucht",
    description: "Erhebliche Mängel, fahrbereit oder bedingt fahrbereit",
  },
  {
    value: 5,
    label: "Note 5 — restaurierungsbedürftig",
    description: "Nicht fahrbereit, Restaurierung erforderlich",
  },
] as const;

export type ConditionGrade = (typeof CONDITION_GRADES)[number]["value"];

export function getConditionGradeLabel(grade: number | null): string | null {
  return CONDITION_GRADES.find((g) => g.value === grade)?.label ?? null;
}

/** Kurzform für die Fahrzeugübersicht, wo wenig Platz ist */
export function getConditionGradeShort(grade: number | null): string | null {
  return grade === null ? null : `Zustand ${grade}`;
}

export const VEHICLE_MAKES = [
  "Alfa Romeo",
  "Aston Martin",
  "Audi",
  "Austin",
  "Austin-Healey",
  "Bentley",
  "BMW",
  "Borgward",
  "Bugatti",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Citroën",
  "Daimler",
  "Datsun",
  "De Tomaso",
  "DKW",
  "Dodge",
  "Facel Vega",
  "Ferrari",
  "Fiat",
  "Ford",
  "Goggomobil",
  "Hanomag",
  "Heinkel",
  "Horch",
  "Hudson",
  "Iso",
  "Jaguar",
  "Jensen",
  "Lada",
  "Lamborghini",
  "Lancia",
  "Land Rover",
  "Lincoln",
  "Lloyd",
  "Lotus",
  "Maserati",
  "Maybach",
  "Mazda",
  "McLaren",
  "Mercedes-Benz",
  "Messerschmitt",
  "MG",
  "Mini",
  "Morgan",
  "Morris",
  "NSU",
  "Oldsmobile",
  "Opel",
  "Packard",
  "Panhard",
  "Peugeot",
  "Plymouth",
  "Pontiac",
  "Porsche",
  "Renault",
  "Riley",
  "Rolls-Royce",
  "Rover",
  "Saab",
  "Simca",
  "Singer",
  "Škoda",
  "Studebaker",
  "Sunbeam",
  "Tatra",
  "Toyota",
  "Trabant",
  "Triumph",
  "TVR",
  "Volkswagen",
  "Volvo",
  "Wanderer",
  "Wartburg",
  "Wolseley",
  "Sonstige",
] as const;

export const BODY_TYPES = [
  "Limousine",
  "Kombi",
  "Coupé",
  "Cabriolet",
  "Roadster",
  "SUV/Geländewagen",
  "Van/Kleinbus",
  "Pickup",
  "Kastenwagen",
  "LKW",
  "Speedster",
  "Targa",
  "Shooting Brake",
  "Sonstige",
] as const;

export const vehicleSchema = z.object({
  make: z
    .string()
    .min(1, "Marke ist erforderlich")
    .max(100, "Marke darf maximal 100 Zeichen lang sein"),
  model: z
    .string()
    .min(1, "Modell ist erforderlich")
    .max(100, "Modell darf maximal 100 Zeichen lang sein"),
  year: z.coerce
    .number()
    .int()
    .min(1886)
    .max(currentYear)
    .optional(),
  first_registration_date: z
    .string()
    .min(1, "Datum der Erstzulassung ist erforderlich")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum muss im Format TT.MM.JJJJ sein"),
  vin: z
    .string()
    .max(50, "FIN darf maximal 50 Zeichen lang sein")
    .regex(/^[A-HJ-NPR-Z0-9]*$/i, "FIN darf nur Buchstaben (außer I, O, Q) und Ziffern enthalten")
    .optional()
    .or(z.literal("")),
  license_plate: z
    .string()
    .max(15, "Kennzeichen darf maximal 15 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  body_type: z
    .string()
    .max(50, "Art der Karosserie darf maximal 50 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  factory_code: z
    .string()
    .max(50, "Werksbezeichnung darf maximal 50 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  color: z
    .string()
    .max(50, "Farbe darf maximal 50 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  engine_type: z
    .string()
    .max(100, "Motortyp darf maximal 100 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  displacement_ccm: z.coerce.number().int().positive("Hubraum muss positiv sein").optional().or(z.literal("")),
  horsepower: z.coerce.number().int().positive("Leistung muss positiv sein").optional().or(z.literal("")),
  mileage_km: z.coerce.number().int().min(0, "Laufleistung kann nicht negativ sein").optional().or(z.literal("")),
  mileage_date: z.string().optional().or(z.literal("")),
  // Optional: Bestehende Fahrzeuge ohne Note bleiben uneingeschränkt nutzbar.
  // Nur der Marktüberblick verlangt sie (PROJ-29, Tech Design C4).
  condition_grade: z.coerce
    .number()
    .int()
    .min(1, "Zustandsnote liegt zwischen 1 und 5")
    .max(5, "Zustandsnote liegt zwischen 1 und 5")
    .optional()
    .or(z.literal("")),
  insurance_company: z
    .string()
    .max(100, "Versicherung darf maximal 100 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  insurance_policy_number: z
    .string()
    .max(50, "Versicherungsnummer darf maximal 50 Zeichen lang sein")
    .optional()
    .or(z.literal("")),
  /**
   * Währung des Fahrzeugs (PROJ-36).
   *
   * Mit Vorgabe statt Pflichtangabe — und das ist dieselbe Entscheidung wie in
   * der Datenbank: Alle vor dem 2026-08-07 angelegten Fahrzeuge gelten als
   * Euro-Fahrzeuge, weil sie es faktisch immer waren. Niemand muss etwas
   * bestätigen oder nachtragen.
   *
   * Anders als beim Anzeige-Formatierer in lib/currency.ts, wo die Währung
   * bewusst KEINEN Vorgabewert hat: Dort hieße ein Vorgabewert, dass ein
   * Franken-Betrag schweigend mit Euro-Zeichen erscheint. Hier heißt er nur,
   * dass ein Fahrzeug ohne Angabe Euro führt — was zutrifft.
   */
  currency: z
    .enum(CURRENCIES.map((c) => c.code) as [Currency, ...Currency[]], {
      error: "Bitte wähle eine Währung",
    })
    .default(DEFAULT_CURRENCY),
});

export interface VehicleFormData {
  make: string;
  model: string;
  year?: number;
  first_registration_date: string;
  vin?: string;
  license_plate?: string;
  body_type?: string;
  factory_code?: string;
  color?: string;
  engine_type?: string;
  displacement_ccm?: number;
  horsepower?: number;
  mileage_km?: number;
  mileage_date?: string;
  condition_grade?: number;
  insurance_company?: string;
  insurance_policy_number?: string;
  currency: Currency;
}

export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  year_estimated: boolean;
  first_registration_date: string | null;
  vin: string | null;
  license_plate: string | null;
  body_type: string | null;
  factory_code: string | null;
  color: string | null;
  engine_type: string | null;
  displacement_ccm: number | null;
  horsepower: number | null;
  mileage_km: number | null;
  mileage_date: string | null;
  condition_grade: number | null;
  insurance_company: string | null;
  insurance_policy_number: string | null;
  /**
   * Währung aller selbst erfassten Beträge dieses Fahrzeugs (PROJ-36).
   * Nicht optional: Die Datenbank hat 'EUR' als Vorgabe, jede Zeile hat also
   * einen Wert. Externe Preise (Ersatzteile, Marktpreis) bleiben davon
   * unberührt und sind weiterhin Euro.
   */
  currency: Currency;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  storage_path: string;
  position: number;
  is_primary: boolean;
  created_at: string;
}

export interface VehicleWithImages extends Vehicle {
  vehicle_images: VehicleImage[];
}

export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const MAX_IMAGES_PER_VEHICLE = 10;
