import { describe, it, expect } from "vitest";
import {
  vehicleDocumentSchema,
  getCategoryLabel,
  formatFileSize,
  isImageMimeType,
  DOCUMENT_CATEGORIES,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_DOCUMENT_SIZE_MB,
} from "./vehicle-document";

const validDocument = {
  title: "Rechnung Ölwechsel",
  category: "rechnung",
  document_date: "2025-03-15",
};

describe("vehicleDocumentSchema — required fields", () => {
  it("accepts valid required fields", () => {
    const result = vehicleDocumentSchema.safeParse(validDocument);
    expect(result.success).toBe(true);
  });

  it("rejects missing title", () => {
    const result = vehicleDocumentSchema.safeParse({ ...validDocument, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing document_date", () => {
    const result = vehicleDocumentSchema.safeParse({ ...validDocument, document_date: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing category", () => {
    const result = vehicleDocumentSchema.safeParse({ ...validDocument, category: undefined });
    expect(result.success).toBe(false);
  });
});

describe("vehicleDocumentSchema — category enum", () => {
  const validCategories = [
    "rechnung", "gutachten", "tuev_bericht", "kaufvertrag",
    "versicherung", "zulassung", "sonstiges",
  ];

  it.each(validCategories)("accepts category '%s'", (category) => {
    const result = vehicleDocumentSchema.safeParse({ ...validDocument, category });
    expect(result.success).toBe(true);
  });

  it("rejects invalid category", () => {
    const result = vehicleDocumentSchema.safeParse({ ...validDocument, category: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("vehicleDocumentSchema — title", () => {
  it("accepts title at max length (200)", () => {
    const result = vehicleDocumentSchema.safeParse({
      ...validDocument,
      title: "a".repeat(200),
    });
    expect(result.success).toBe(true);
  });

  it("rejects title over 200 characters", () => {
    const result = vehicleDocumentSchema.safeParse({
      ...validDocument,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

describe("vehicleDocumentSchema — optional fields", () => {
  it("accepts all optional fields filled", () => {
    const result = vehicleDocumentSchema.safeParse({
      ...validDocument,
      description: "Beschreibung des Dokuments",
      service_entry_id: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string for optional fields", () => {
    const result = vehicleDocumentSchema.safeParse({
      ...validDocument,
      description: "",
      service_entry_id: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts undefined for optional fields", () => {
    const result = vehicleDocumentSchema.safeParse(validDocument);
    expect(result.success).toBe(true);
  });

  it("rejects description over 1000 characters", () => {
    const result = vehicleDocumentSchema.safeParse({
      ...validDocument,
      description: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

describe("getCategoryLabel", () => {
  it("returns correct label for each category", () => {
    expect(getCategoryLabel("rechnung")).toBe("Rechnung");
    expect(getCategoryLabel("gutachten")).toBe("Gutachten");
    expect(getCategoryLabel("tuev_bericht")).toBe("TÜV-Bericht");
    expect(getCategoryLabel("kaufvertrag")).toBe("Kaufvertrag");
    expect(getCategoryLabel("versicherung")).toBe("Versicherung");
    expect(getCategoryLabel("zulassung")).toBe("Zulassung");
    expect(getCategoryLabel("sonstiges")).toBe("Sonstiges");
  });

  it("returns raw category for unknown value", () => {
    expect(getCategoryLabel("unknown" as never)).toBe("unknown");
  });
});

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(5242880)).toBe("5.0 MB");
  });

  it("formats 10 MB", () => {
    expect(formatFileSize(10485760)).toBe("10.0 MB");
  });
});

describe("isImageMimeType", () => {
  it("returns true for image types", () => {
    expect(isImageMimeType("image/jpeg")).toBe(true);
    expect(isImageMimeType("image/png")).toBe(true);
    expect(isImageMimeType("image/webp")).toBe(true);
  });

  it("returns false for non-image types", () => {
    expect(isImageMimeType("application/pdf")).toBe(false);
    expect(isImageMimeType("text/plain")).toBe(false);
  });
});

describe("DOCUMENT_CATEGORIES constant", () => {
  it("has 7 categories", () => {
    expect(DOCUMENT_CATEGORIES).toHaveLength(7);
  });

  it("each category has value and label", () => {
    DOCUMENT_CATEGORIES.forEach((cat) => {
      expect(cat.value.length).toBeGreaterThan(0);
      expect(cat.label.length).toBeGreaterThan(0);
    });
  });
});

describe("Constants", () => {
  it("MAX_DOCUMENT_SIZE_BYTES is 10 MB", () => {
    expect(MAX_DOCUMENT_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });

  it("MAX_DOCUMENT_SIZE_MB is 10", () => {
    expect(MAX_DOCUMENT_SIZE_MB).toBe(10);
  });
});
