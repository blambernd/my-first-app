import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  PROVISIONAL_IMPORT_LIMIT_PER_VEHICLE,
  type DraftField,
  type FieldOrigin,
} from "@/lib/validations/scheckheft-import";

/**
 * Modell für die Auswertung.
 *
 * Bewusst ein Konfigurationswert: Ob Haiku 4.5 Handschrift und Gummistempel
 * gut genug liest, ist offen und gehört in die QA (PROJ-35). Ein Wechsel auf
 * ein stärkeres Modell ist genau diese eine Zeile.
 */
export const IMPORT_MODEL = "claude-haiku-4-5";

/** Seiten je Auftrag. Deckelt Laufzeit und Kosten eines einzelnen Vorgangs. */
export const MAX_PAGES_PER_JOB = 20;

/**
 * Zweite Schranke neben dem Kontingent je Fahrzeug.
 *
 * Das Fahrzeug-Kontingent allein ist durchlässig: Premium-Nutzer dürfen
 * beliebig viele Fahrzeuge anlegen und damit das Kontingent vervielfachen.
 *
 * ACHTUNG: Beide Zahlen sind Platzhalter, keine getroffenen Festlegungen —
 * die Höhe des Kontingents ist laut Spec eine offene Entscheidung.
 */
export const IMPORT_LIMIT_PER_ACCOUNT = 100;
export const ACCOUNT_LIMIT_WINDOW_DAYS = 30;

export { PROVISIONAL_IMPORT_LIMIT_PER_VEHICLE as IMPORT_LIMIT_PER_VEHICLE };

/** Was das Modell je erkannter Position zurückgeben soll. */
const extractedEntrySchema = z.object({
  service_date: z
    .string()
    .nullable()
    .describe("Datum im Format JJJJ-MM-TT. null, wenn nicht lesbar."),
  entry_type: z
    .enum(["inspection", "oil_change", "repair", "tuv_hu", "restoration", "other"])
    .nullable()
    .describe("Art des Vorgangs. 'other', wenn erkennbar aber nicht zuzuordnen."),
  description: z
    .string()
    .nullable()
    .describe(
      "Wörtlich übernommener Text aus dem Vordruck oder der Rechnungsposition. null, wenn kein Text vorhanden ist."
    ),
  mileage_km: z
    .number()
    .int()
    .nullable()
    .describe("Kilometerstand als ganze Zahl. null, wenn nicht lesbar."),
  workshop_name: z
    .string()
    .nullable()
    .describe("Name der Werkstatt aus Stempel oder Briefkopf. null, wenn unlesbar."),
  cost_cents: z
    .number()
    .int()
    .nullable()
    .describe("Betrag in Cent. Steht in einem Scheckheft fast nie — dann null."),
  next_due_date: z
    .string()
    .nullable()
    .describe("Nächste Fälligkeit im Format JJJJ-MM-TT, etwa aus einem TÜV-Bericht."),
});

const extractionSchema = z.object({
  entries: z
    .array(extractedEntrySchema)
    .describe("Alle auf dieser Seite erkennbaren Vorgänge, chronologisch."),
});

export type ExtractedEntry = z.infer<typeof extractedEntrySchema>;

const SYSTEM_PROMPT = `Du liest Belege zur Fahrzeughistorie von Oldtimern aus: Seiten aus Papier-Scheckheften, Werkstattrechnungen und TÜV-Berichte.

Eine Scheckheft-Doppelseite trägt oft mehrere Stempel — gib dann mehrere Einträge zurück, einen je Vorgang. Eine Werkstattrechnung ergibt in der Regel genau einen Eintrag.

Die wichtigste Regel: Rate nichts.

- Was du nicht sicher lesen kannst, gibst du als null zurück. Ein leeres Feld ist immer besser als ein geratener Wert.
- Erfinde keine Beschreibung. Ein Scheckheft-Raster enthält meist keinen Fließtext — dann ist description null. Übernimm nur, was gedruckt oder geschrieben dasteht.
- Rechne Datumsangaben ins Format JJJJ-MM-TT um. Fehlt die Jahreszahl, gib null zurück statt sie zu ergänzen.
- Kilometerstände sind ganze Zahlen ohne Trennzeichen. Bei überstempelten oder unklaren Ziffern: null.
- Beträge in Cent. In einem Scheckheft stehen normalerweise keine Preise.
- Ist auf der Seite gar kein Vorgang erkennbar, gib eine leere Liste zurück.

Die Angaben werden dem Nutzer zur Prüfung vorgelegt und erst nach seiner Bestätigung gespeichert. Ein leeres Feld kostet ihn einen Tastendruck — ein falsch geratener Wert kostet ihn die Glaubwürdigkeit seiner Fahrzeughistorie.`;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type ImageMediaType = (typeof IMAGE_TYPES)[number];

function isImageType(mimeType: string): mimeType is ImageMediaType {
  return (IMAGE_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Wertet eine einzelne Seite aus.
 *
 * Wirft bei fehlendem Schlüssel oder Fehlern der Schnittstelle — der Aufrufer
 * übersetzt das in einen verständlichen Grund für den Nutzer.
 */
export async function extractEntriesFromPage(
  fileBytes: Uint8Array,
  mimeType: string
): Promise<ExtractedEntry[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ist nicht konfiguriert");
  }

  const client = new Anthropic({ apiKey });
  const data = Buffer.from(fileBytes).toString("base64");

  const content =
    mimeType === "application/pdf"
      ? ([
          {
            type: "document" as const,
            source: {
              type: "base64" as const,
              media_type: "application/pdf" as const,
              data,
            },
          },
          {
            type: "text" as const,
            text: "Lies alle Vorgänge aus diesem Beleg aus.",
          },
        ])
      : isImageType(mimeType)
        ? ([
            {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: mimeType,
                data,
              },
            },
            {
              type: "text" as const,
              text: "Lies alle Vorgänge aus dieser Seite aus.",
            },
          ])
        : null;

  if (!content) {
    throw new Error(`Nicht unterstützter Dateityp: ${mimeType}`);
  }

  const response = await client.messages.parse({
    model: IMPORT_MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
    output_config: { format: zodOutputFormat(extractionSchema) },
  });

  return response.parsed_output?.entries ?? [];
}

const DRAFT_FIELD_LIST: DraftField[] = [
  "service_date",
  "entry_type",
  "description",
  "mileage_km",
  "workshop_name",
  "cost_cents",
  "next_due_date",
];

/**
 * Leitet aus einer erkannten Position die Herkunft je Feld ab: Was das Modell
 * gelesen hat, gilt als "extracted", ein null-Wert als "empty".
 */
export function buildFieldOrigins(
  entry: ExtractedEntry
): Partial<Record<DraftField, FieldOrigin>> {
  const origins: Partial<Record<DraftField, FieldOrigin>> = {};
  for (const field of DRAFT_FIELD_LIST) {
    const value = entry[field as keyof ExtractedEntry];
    origins[field] = value === null || value === undefined ? "empty" : "extracted";
  }
  return origins;
}

/**
 * Prüft ein vom Modell geliefertes Datum. Alles, was nicht als JJJJ-MM-TT
 * ankommt, wird verworfen statt zurechtgebogen.
 */
export function sanitizeDate(value: string | null): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return value;
}

/** Kilometerstand auf den erlaubten Bereich prüfen. */
export function sanitizeMileage(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < 0 || rounded > 9999999) return null;
  return rounded;
}

/** Betrag auf den erlaubten Bereich prüfen. */
export function sanitizeCents(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < 0) return null;
  return rounded;
}

/** Text kürzen statt die Datenbankprüfung auflaufen zu lassen. */
export function sanitizeText(value: string | null, maxLength: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLength);
}
