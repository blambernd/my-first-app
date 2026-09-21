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
      // PROJ-40 kam hinzu; ohne Angabe wird keine Rolle gewährt
      p_grant_workshop: false,
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

/**
 * Die verbleibende Werkstattrolle (PROJ-40).
 *
 * Geprüft wird auch hier nur die Naht: Kommt die Entscheidung des Kunden
 * unverfälscht an der Datenbankfunktion an? Ob daraus tatsächlich eine Rolle
 * wird, entscheidet die Funktion selbst — sie prüft zusätzlich, ob die
 * Werkstatt sie überhaupt angeboten hat. Diese zweite Prüfung ist der
 * eigentliche Schutz und liegt bewusst nicht hier im Browser-nahen Teil.
 */
describe("POST /api/transfers/[token]/accept — Werkstattrolle (PROJ-40)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "kaeufer" } } });
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });
  });

  it("reicht die Zustimmung des Kunden weiter", async () => {
    await post({ share_anonymously: false, grant_workshop_role: true });

    expect(mockRpc).toHaveBeenCalledWith(
      "accept_vehicle_transfer",
      expect.objectContaining({ p_grant_workshop: true })
    );
  });

  it("reicht die Ablehnung des Kunden weiter", async () => {
    await post({ share_anonymously: false, grant_workshop_role: false });

    expect(mockRpc).toHaveBeenCalledWith(
      "accept_vehicle_transfer",
      expect.objectContaining({ p_grant_workshop: false })
    );
  });

  it("gewährt ohne Angabe nichts — Schweigen ist keine Zustimmung", async () => {
    await post({ share_anonymously: false });

    expect(mockRpc).toHaveBeenCalledWith(
      "accept_vehicle_transfer",
      expect.objectContaining({ p_grant_workshop: false })
    );
  });

  it("weist einen wahrheitsähnlichen Wert ab, statt ihn zu deuten", async () => {
    // Ein "ja" aus einem zurechtgebauten Aufruf wird nicht als Zustimmung
    // gelesen — die Prüfung verlangt einen echten Wahrheitswert. Die
    // Anfrage scheitert dann, und das ist die richtige Antwort: Lieber eine
    // sichtbare Ablehnung als eine stillschweigend unterstellte Zustimmung
    // zu einer dauerhaften Zugriffsberechtigung.
    const antwort = await post({
      share_anonymously: false,
      grant_workshop_role: "ja",
    });

    expect(antwort.status).toBe(400);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("gewährt bei unbrauchbarer Angabe keine Rolle", async () => {
    // Die Route lehnt den ganzen Rumpf ab (Verhalten aus PROJ-33) und ruft
    // die Datenbankfunktion gar nicht erst auf. Entscheidend für dieses
    // Feature: Es entsteht keine Rolle. Der Kunde kann es mit einem
    // unverbogenen Formular erneut versuchen.
    const antwort = await post({
      share_anonymously: false,
      grant_workshop_role: { unsinn: true },
    });

    expect(antwort.status).toBe(400);
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
