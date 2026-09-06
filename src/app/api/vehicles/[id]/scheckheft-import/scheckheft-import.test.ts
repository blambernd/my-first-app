import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      data,
      status: init?.status || 200,
    }),
  },
  after: vi.fn(),
}));

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockStorageFrom = vi.fn();

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
  storage: { from: mockStorageFrom },
};

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/lib/scheckheft-import-processor", () => ({
  processImportJob: vi.fn(),
  reclaimStaleJobs: vi.fn(),
}));

/** Kettenfähiger und zugleich awaitbarer Abfrage-Bauer. */
function builder(result: unknown) {
  const b: Record<string, unknown> = {};
  const chain = () => b;
  for (const method of [
    "select",
    "eq",
    "in",
    "gte",
    "lt",
    "not",
    "order",
    "limit",
    "insert",
    "update",
    "delete",
  ]) {
    b[method] = vi.fn(chain);
  }
  b.maybeSingle = vi.fn(() => Promise.resolve(result));
  b.single = vi.fn(() => Promise.resolve(result));
  b.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve(result).then(resolve);
  return b;
}

/** Antwortet je Tabelle mit einem eigenen Ergebnis. */
function routeTables(map: Record<string, unknown>) {
  mockFrom.mockImplementation((table: string) =>
    builder(map[table] ?? { data: null, error: null, count: 0 })
  );
}

function fakeRequest(files: File[]) {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  return { formData: () => Promise.resolve(form) } as unknown as Request;
}

function pngFile(name = "seite.png", size = 1000) {
  return new File([new Uint8Array(size)], name, { type: "image/png" });
}

const params = Promise.resolve({ id: "vehicle-1" });

describe("POST /api/vehicles/[id]/scheckheft-import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("weist nicht angemeldete Anfragen ab (401)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { POST } = await import("./route");

    const response = await POST(fakeRequest([pngFile()]), { params });
    expect((response as unknown as { status: number }).status).toBe(401);
  });

  it("weist Betrachter ab (403)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    routeTables({
      vehicles: { data: null, error: null },
      vehicle_members: { data: { role: "betrachter" }, error: null },
    });
    const { POST } = await import("./route");

    const response = await POST(fakeRequest([pngFile()]), { params });
    expect((response as unknown as { status: number }).status).toBe(403);
  });

  it("weist Fremde ohne Mitgliedschaft ab (403)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    routeTables({
      vehicles: { data: null, error: null },
      vehicle_members: { data: null, error: null },
    });
    const { POST } = await import("./route");

    const response = await POST(fakeRequest([pngFile()]), { params });
    expect((response as unknown as { status: number }).status).toBe(403);
  });

  it("lehnt eine Anfrage ohne Seiten ab (400)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    routeTables({ vehicles: { data: { id: "vehicle-1" }, error: null } });
    const { POST } = await import("./route");

    const response = await POST(fakeRequest([]), { params });
    expect((response as unknown as { status: number }).status).toBe(400);
  });

  it("lehnt zu viele Seiten ab (400)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    routeTables({ vehicles: { data: { id: "vehicle-1" }, error: null } });
    const { POST } = await import("./route");

    const files = Array.from({ length: 21 }, (_, i) => pngFile(`seite-${i}.png`));
    const response = await POST(fakeRequest(files), { params });

    const result = response as unknown as { status: number; data: { error: string } };
    expect(result.status).toBe(400);
    expect(result.data.error).toContain("20");
  });

  it("lehnt nicht unterstützte Dateitypen ab (400)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    routeTables({ vehicles: { data: { id: "vehicle-1" }, error: null } });
    const { POST } = await import("./route");

    const docx = new File([new Uint8Array(10)], "beleg.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const response = await POST(fakeRequest([docx]), { params });

    const result = response as unknown as { status: number; data: { error: string } };
    expect(result.status).toBe(400);
    expect(result.data.error).toContain("beleg.docx");
  });

  it("lehnt Dateien über 10 MB ab (400)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    routeTables({ vehicles: { data: { id: "vehicle-1" }, error: null } });
    const { POST } = await import("./route");

    const big = pngFile("gross.png", 11 * 1024 * 1024);
    const response = await POST(fakeRequest([big]), { params });

    const result = response as unknown as { status: number; data: { error: string } };
    expect(result.status).toBe(400);
    expect(result.data.error).toContain("10 MB");
  });
});

describe("POST /api/vehicles/[id]/scheckheft-import/[jobId]/confirm", () => {
  const jobParams = Promise.resolve({ id: "vehicle-1", jobId: "job-1" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("weist nicht angemeldete Anfragen ab (401)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { POST } = await import("./[jobId]/confirm/route");

    const request = { json: () => Promise.resolve({ entries: [] }) } as unknown as Request;
    const response = await POST(request, { params: jobParams });
    expect((response as unknown as { status: number }).status).toBe(401);
  });

  it("lehnt die Übernahme ab, solange der Auftrag nicht bereit ist (409)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    routeTables({
      vehicles: { data: { id: "vehicle-1" }, error: null },
      scheckheft_import_jobs: { data: { id: "job-1", status: "running" }, error: null },
    });
    const { POST } = await import("./[jobId]/confirm/route");

    const request = { json: () => Promise.resolve({ entries: [] }) } as unknown as Request;
    const response = await POST(request, { params: jobParams });
    expect((response as unknown as { status: number }).status).toBe(409);
  });

  it("lehnt eine leere Auswahl ab (400)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    routeTables({
      vehicles: { data: { id: "vehicle-1" }, error: null },
      scheckheft_import_jobs: { data: { id: "job-1", status: "ready" }, error: null },
    });
    const { POST } = await import("./[jobId]/confirm/route");

    const request = { json: () => Promise.resolve({ entries: [] }) } as unknown as Request;
    const response = await POST(request, { params: jobParams });
    expect((response as unknown as { status: number }).status).toBe(400);
  });

  it("lehnt einen Eintrag ohne Kilometerstand ab (400)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    routeTables({
      vehicles: { data: { id: "vehicle-1" }, error: null },
      scheckheft_import_jobs: { data: { id: "job-1", status: "ready" }, error: null },
    });
    const { POST } = await import("./[jobId]/confirm/route");

    const request = {
      json: () =>
        Promise.resolve({
          entries: [
            {
              id: "11111111-1111-4111-8111-111111111111",
              service_date: "2020-01-01",
              entry_type: "inspection",
            },
          ],
        }),
    } as unknown as Request;

    const response = await POST(request, { params: jobParams });
    expect((response as unknown as { status: number }).status).toBe(400);
  });

  it("lehnt Entwürfe ab, die zu einem anderen Auftrag gehören (400)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    routeTables({
      vehicles: { data: { id: "vehicle-1" }, error: null },
      scheckheft_import_jobs: { data: { id: "job-1", status: "ready" }, error: null },
      // Der Auftrag kennt diesen Entwurf nicht
      scheckheft_import_drafts: { data: [], error: null },
    });
    const { POST } = await import("./[jobId]/confirm/route");

    const request = {
      json: () =>
        Promise.resolve({
          entries: [
            {
              id: "22222222-2222-4222-8222-222222222222",
              service_date: "2020-01-01",
              entry_type: "inspection",
              mileage_km: 10000,
            },
          ],
        }),
    } as unknown as Request;

    const response = await POST(request, { params: jobParams });
    const result = response as unknown as { status: number; data: { error: string } };
    expect(result.status).toBe(400);
    expect(result.data.error).toContain("nicht zu diesem Auftrag");
  });
});

describe("POST /api/vehicles/[id]/scheckheft-import/[jobId]/discard", () => {
  const jobParams = Promise.resolve({ id: "vehicle-1", jobId: "job-1" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("weist nicht angemeldete Anfragen ab (401)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { POST } = await import("./[jobId]/discard/route");

    const response = await POST({} as Request, { params: jobParams });
    expect((response as unknown as { status: number }).status).toBe(401);
  });

  it("meldet einen unbekannten Auftrag als nicht gefunden (404)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    routeTables({
      vehicles: { data: { id: "vehicle-1" }, error: null },
      scheckheft_import_jobs: { data: null, error: null },
    });
    const { POST } = await import("./[jobId]/discard/route");

    const response = await POST({} as Request, { params: jobParams });
    expect((response as unknown as { status: number }).status).toBe(404);
  });
});
