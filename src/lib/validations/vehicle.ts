import { z } from "zod";

const currentYear = new Date().getFullYear();

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
    .int("Baujahr muss eine ganze Zahl sein")
    .min(1886, "Baujahr muss mindestens 1886 sein")
    .max(currentYear, `Baujahr darf maximal ${currentYear} sein`),
  year_estimated: z.boolean().default(false),
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
});

export interface VehicleFormData {
  make: string;
  model: string;
  year: number;
  year_estimated: boolean;
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
  insurance_company?: string;
  insurance_policy_number?: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  year_estimated: boolean;
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
  insurance_company: string | null;
  insurance_policy_number: string | null;
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
