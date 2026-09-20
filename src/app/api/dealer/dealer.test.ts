import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      data,
      status: init?.status || 200,
    }),
  },
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

/** Die zuletzt an dealer_sales übergebene Zeile — für Inhaltsprüfungen. */
let insertedRow: Record<string, unknown> | null = null;

/**
 * Bildet die Abfrageketten der Route nach.
 *
 * `vehicle` und `purchase` bestimmen, was die beiden Leseabfragen liefern;
 * `insertError` lässt das Schreiben scheitern.
 */
function setupSupabase(options: {
  vehicle?: Record<string, unknown> | null;
  purchase?: Record<string, unknown> | null;
  insertError?: { message: string } | null;
}) {
  const { vehicle = null, purchase = null, insertError = null } = options;
  insertedRow = null;

  mockFrom.mockImplementation((table: string) => {
    if (table === "vehicles") {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        maybeSingle: vi.fn(() => Promise.resolve({ data: vehicle })),
      };
      return chain;
    }

    if (table === "vehicle_purchases") {
      const chain = {
        select: vi.fn(() => chain),
        eq: vi.fn(() => chain),
        maybeSingle: vi.fn(() => Promise.resolve({ data: purchase })),
      };
      return chain;
    }

    if (table === "dealer_sales") {
      return {
        insert: vi.fn((row: Record<string, unknown>) => {
          insertedRow = row;
          return Promise.resolve({ error: insertError });
        }),
      };
    }

    throw new Error(`Unerwartete Tabelle: ${table}`);
  });
}

function anfrage(body: unknown) {
  return new Request("http://localhost/api/dealer/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const FAHRZEUG = {
  id: "11111111-1111-4111-8111-111111111111",
  make: "Mercedes-Benz",
  model: "SL380",
  year: 1980,
  currency: "EUR",
  created_at: "2026-01-15T10:00:00Z",
};

const GUELTIG = {
  vehicle_id: FAHRZEUG.id,
  sold_on: "2026-08-01",
  sale_price_eur: 48000,
};

describe("POST /api/dealer/sales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("weist nicht angemeldete Anfragen ab, ohne die Datenbank zu fragen", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import("./sales/route");
    const response = (await POST(anfrage(GUELTIG))) as unknown as {
      status: number;
    };

    expect(response.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("weist ein fremdes Fahrzeug ab", async () => {
    // Die Abfrage filtert auf user_id; ein fremdes Fahrzeug kommt als
    // „nicht gefunden" zurück. Ohne diese Prüfung könnte jeder Angemeldete
    // fremde Fahrzeuge in seinen Bestand schreiben.
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupSupabase({ vehicle: null });

    const { POST } = await import("./sales/route");
    const response = (await POST(anfrage(GUELTIG))) as unknown as {
      status: number;
    };

    expect(response.status).toBe(404);
    expect(insertedRow).toBeNull();
  });

  it("lehnt ein Verkaufsdatum vor dem Kaufdatum ab", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupSupabase({
      vehicle: FAHRZEUG,
      purchase: { price_cents: 4000000, purchased_on: "2026-05-01" },
    });

    const { POST } = await import("./sales/route");
    const response = (await POST(
      anfrage({ ...GUELTIG, sold_on: "2026-03-01" })
    )) as unknown as { status: number; data: { error: string } };

    expect(response.status).toBe(400);
    expect(response.data.error).toMatch(/vor dem Kaufdatum/);
    expect(insertedRow).toBeNull();
  });

  it("weist ein unbrauchbares Datumsformat ab", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupSupabase({ vehicle: FAHRZEUG });

    const { POST } = await import("./sales/route");
    const response = (await POST(
      anfrage({ ...GUELTIG, sold_on: "01.08.2026" })
    )) as unknown as { status: number };

    expect(response.status).toBe(400);
  });

  it("schreibt eine vollstaendige Abschrift samt Fahrzeugkennung", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupSupabase({
      vehicle: FAHRZEUG,
      purchase: { price_cents: 4000000, purchased_on: "2026-02-01" },
    });

    const { POST } = await import("./sales/route");
    const response = (await POST(anfrage(GUELTIG))) as unknown as {
      status: number;
    };

    expect(response.status).toBe(201);
    expect(insertedRow).toMatchObject({
      user_id: "user-1",
      make: "Mercedes-Benz",
      model: "SL380",
      year: 1980,
      purchased_on: "2026-02-01",
      purchase_price_cents: 4000000,
      sold_on: "2026-08-01",
      sale_price_cents: 4800000,
      origin: "manual",
    });
    // Die Kennung erlaubt der Bestandsliste zu filtern (QA BUG-1). Dass der
    // Vorgang das Fahrzeug überlebt, sichert nicht ihre Abwesenheit, sondern
    // die vollständige Abschrift daneben plus ON DELETE SET NULL.
    expect(insertedRow).toMatchObject({ vehicle_id: FAHRZEUG.id });
  });

  it("nimmt den Vorgang auch ohne Erlös an", async () => {
    // Ohne Erlös bleibt der Vorgang erhalten, nur die Spanne entfällt.
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupSupabase({ vehicle: FAHRZEUG, purchase: null });

    const { POST } = await import("./sales/route");
    const response = (await POST(
      anfrage({ vehicle_id: FAHRZEUG.id, sold_on: "2026-08-01" })
    )) as unknown as { status: number };

    expect(response.status).toBe(201);
    expect(insertedRow).toMatchObject({
      sale_price_cents: null,
      purchase_price_cents: null,
      // Ohne Kaufdatum tritt das Anlagedatum des Fahrzeugs an seine Stelle
      purchased_on: "2026-01-15",
    });
  });

  it("meldet einen Schreibfehler, statt Erfolg vorzutäuschen", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupSupabase({
      vehicle: FAHRZEUG,
      insertError: { message: "relation does not exist" },
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { POST } = await import("./sales/route");
    const response = (await POST(anfrage(GUELTIG))) as unknown as {
      status: number;
    };

    expect(response.status).toBe(500);
    errorSpy.mockRestore();
  });
});

/**
 * Nachtragen und Zurücknehmen (QA BUG-3 und BUG-4).
 *
 * Beide Zugriffe binden an das eigene Konto: Die Abfragen filtern auf
 * `user_id`, ein fremder Vorgang kommt als „nicht gefunden" zurück.
 */
function setupSingleRow(options: {
  row?: { id: string } | null;
  error?: { message: string } | null;
}) {
  const { row = null, error = null } = options;
  const aufrufe: Record<string, unknown>[] = [];

  mockFrom.mockImplementation(() => {
    const chain = {
      update: vi.fn((werte: Record<string, unknown>) => {
        aufrufe.push(werte);
        return chain;
      }),
      delete: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      select: vi.fn(() => chain),
      maybeSingle: vi.fn(() => Promise.resolve({ data: row, error })),
    };
    return chain;
  });

  return aufrufe;
}

const VORGANG = "22222222-2222-4222-8222-222222222222";
const params = Promise.resolve({ id: VORGANG });

describe("PATCH /api/dealer/sales/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("weist ohne Sitzung ab", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { PATCH } = await import("./sales/[id]/route");
    const response = (await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ sale_price_eur: 1000 }),
      }),
      { params }
    )) as unknown as { status: number };

    expect(response.status).toBe(401);
  });

  it("trägt einen Erlös nach", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const aufrufe = setupSingleRow({ row: { id: VORGANG } });

    const { PATCH } = await import("./sales/[id]/route");
    const response = (await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ sale_price_eur: 48000 }),
      }),
      { params }
    )) as unknown as { status: number };

    expect(response.status).toBe(200);
    expect(aufrufe[0]).toMatchObject({ sale_price_cents: 4800000 });
  });

  it("entfernt den Erlös bei null, statt ihn auf Null zu setzen", async () => {
    // Kein Erlös und ein Erlös von null sind verschiedene Aussagen: Das eine
    // lässt die Spanne entfallen, das andere behauptet einen Verkauf zum
    // Nulltarif.
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const aufrufe = setupSingleRow({ row: { id: VORGANG } });

    const { PATCH } = await import("./sales/[id]/route");
    await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ sale_price_eur: null }),
      }),
      { params }
    );

    expect(aufrufe[0]).toMatchObject({ sale_price_cents: null });
  });

  it("meldet einen fremden Vorgang als nicht gefunden", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupSingleRow({ row: null });

    const { PATCH } = await import("./sales/[id]/route");
    const response = (await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ sale_price_eur: 1000 }),
      }),
      { params }
    )) as unknown as { status: number };

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/dealer/sales/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("weist ohne Sitzung ab", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { DELETE } = await import("./sales/[id]/route");
    const response = (await DELETE(new Request("http://localhost"), {
      params,
    })) as unknown as { status: number };

    expect(response.status).toBe(401);
  });

  it("nimmt einen eigenen Vorgang zurück", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupSingleRow({ row: { id: VORGANG } });

    const { DELETE } = await import("./sales/[id]/route");
    const response = (await DELETE(new Request("http://localhost"), {
      params,
    })) as unknown as { status: number };

    expect(response.status).toBe(200);
  });

  it("meldet einen fremden Vorgang als nicht gefunden", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    setupSingleRow({ row: null });

    const { DELETE } = await import("./sales/[id]/route");
    const response = (await DELETE(new Request("http://localhost"), {
      params,
    })) as unknown as { status: number };

    expect(response.status).toBe(404);
  });
});
