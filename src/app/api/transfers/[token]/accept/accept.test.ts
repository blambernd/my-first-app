import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Die Übergabe-Route mit Währung (PROJ-36).
 *
 * Geprüft wird hier die **Nahtstelle**: Was der Browser schickt, muss
 * unverändert und vollständig an die Datenbankfunktion gehen. Genau an dieser
 * Naht wäre der stille Datenverlust entstanden — eine Oberfläche, die die
 * Währung erhebt, über einer Route, die sie fallen lässt, hätte einen
 * CHF-Verkauf als EUR in `vehicle_sales` abgelegt. Diese Tabelle ist für
 * niemanden lesbar, der Fehler wäre also von niemandem mehr auffindbar.
 *
 * Die maßgebliche Prüfung bleibt die in der Datenbankfunktion; die hier ist
 * die Zusicherung, dass sie überhaupt etwas zu prüfen bekommt.
 */

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      data,
      status: init?.status ?? 200,
    }),
  },
}));

const mockGetUser = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({ auth: { getUser: mockGetUser }, rpc: mockRpc })
  ),
}));

const TOKEN = "11111111-2222-3333-4444-555555555555";

function anfrage(rumpf: unknown) {
  return new Request(`http://localhost/api/transfers/${TOKEN}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rumpf),
  });
}

const params = Promise.resolve({ token: TOKEN });

async function post(rumpf: unknown) {
  const { POST } = await import("./route");
  return (await POST(anfrage(rumpf), { params })) as unknown as {
    data: Record<string, unknown>;
    status: number;
  };
}

describe("POST /api/transfers/[token]/accept — Währung", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "kaeufer-1" } } });
    mockRpc.mockResolvedValue({
      data: { success: true, vehicleId: "fzg-1" },
      error: null,
    });
  });

  it("reicht die gewählte Währung an die Datenbankfunktion weiter", async () => {
    await post({
      share_anonymously: true,
      purchase_price_eur: 42000,
      currency: "CHF",
    });

    expect(mockRpc).toHaveBeenCalledWith(
      "accept_vehicle_transfer",
      expect.objectContaining({ p_currency: "CHF" })
    );
  });

  it("rechnet den Preis nicht um — 42.000 CHF bleiben 4.200.000 Rappen", async () => {
    // Der Kern von PROJ-36: Die Zahl geht unverändert durch, nur die
    // Beschriftung wechselt.
    await post({
      share_anonymously: true,
      purchase_price_eur: 42000,
      currency: "CHF",
    });

    expect(mockRpc).toHaveBeenCalledWith(
      "accept_vehicle_transfer",
      expect.objectContaining({ p_price_cents: 4_200_000, p_currency: "CHF" })
    );
  });

  it("schickt ohne Angabe null — die Datenbank behält dann die bisherige Währung", async () => {
    // Die Übergabe darf an einer Nebenangabe nicht scheitern.
    await post({ share_anonymously: false });

    expect(mockRpc).toHaveBeenCalledWith(
      "accept_vehicle_transfer",
      expect.objectContaining({ p_currency: null })
    );
  });

  it("weist einen unbekannten Währungscode ab, statt ihn durchzureichen", async () => {
    const antwort = await post({
      share_anonymously: false,
      currency: "XYZ",
    });

    expect(antwort.status).toBe(400);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("nimmt jede der neun Währungen an", async () => {
    for (const code of [
      "EUR",
      "CHF",
      "GBP",
      "USD",
      "SEK",
      "DKK",
      "NOK",
      "PLN",
      "CZK",
    ]) {
      mockRpc.mockClear();
      const antwort = await post({ share_anonymously: false, currency: code });
      expect(antwort.status, `Währung ${code}`).toBe(200);
      expect(mockRpc).toHaveBeenCalledWith(
        "accept_vehicle_transfer",
        expect.objectContaining({ p_currency: code })
      );
    }
  });

  it("übergibt weiterhin alle bisherigen Angaben (PROJ-33 bleibt unberührt)", async () => {
    await post({
      share_anonymously: true,
      purchase_price_eur: 18500,
      condition_grade: 2,
      mileage_km: 52000,
      currency: "GBP",
    });

    expect(mockRpc).toHaveBeenCalledWith("accept_vehicle_transfer", {
      p_token: TOKEN,
      p_price_cents: 1_850_000,
      p_condition_grade: 2,
      p_mileage_km: 52000,
      p_share: true,
      p_currency: "GBP",
    });
  });

  it("lässt niemanden ohne Anmeldung annehmen", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const antwort = await post({ share_anonymously: false, currency: "CHF" });

    expect(antwort.status).toBe(401);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("nimmt auch ohne lesbaren Rumpf an — ohne Angaben", async () => {
    // Ein älterer Browserstand darf die Übergabe nicht verhindern.
    const { POST } = await import("./route");
    const request = new Request(
      `http://localhost/api/transfers/${TOKEN}/accept`,
      { method: "POST" }
    );
    const antwort = (await POST(request, { params })) as unknown as {
      status: number;
    };

    expect(antwort.status).toBe(200);
    expect(mockRpc).toHaveBeenCalledWith(
      "accept_vehicle_transfer",
      expect.objectContaining({ p_currency: null, p_share: false })
    );
  });
});
