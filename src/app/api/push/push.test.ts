import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Next.js modules
vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      data,
      status: init?.status || 200,
    }),
  },
}));

// Mock supabase-server
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
};

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("Push API - vapid-key", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns public key when configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "test-public-key-123");
    const { GET } = await import("./vapid-key/route");
    const response = await GET();
    expect((response as unknown as { data: { publicKey: string } }).data.publicKey).toBe(
      "test-public-key-123"
    );
    vi.unstubAllEnvs();
  });

  it("returns 503 when VAPID key is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "");
    const { GET } = await import("./vapid-key/route");
    const response = await GET();
    expect((response as unknown as { status: number }).status).toBe(503);
    vi.unstubAllEnvs();
  });
});

describe("Push API - subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { POST } = await import("./subscribe/route");
    const request = new Request("http://localhost/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "https://push.example.com/sub",
        keys: { p256dh: "key1", auth: "key2" },
      }),
    });

    const response = await POST(request);
    expect((response as unknown as { status: number }).status).toBe(401);
  });

  it("returns 400 for invalid subscription data", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const { POST } = await import("./subscribe/route");
    const request = new Request("http://localhost/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: "not-a-url" }),
    });

    const response = await POST(request);
    expect((response as unknown as { status: number }).status).toBe(400);
  });

  it("saves valid subscription", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    const { POST } = await import("./subscribe/route");
    const request = new Request("http://localhost/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: "https://push.example.com/sub",
        keys: { p256dh: "key1", auth: "key2" },
      }),
    });

    const response = await POST(request);
    expect((response as unknown as { status: number }).status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith("push_subscriptions");
  });
});

describe("Push API - preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated GET", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { GET } = await import("./preferences/route");
    const response = await GET();
    expect((response as unknown as { status: number }).status).toBe(401);
  });

  it("returns defaults when no preferences exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    });

    const { GET } = await import("./preferences/route");
    const response = await GET();
    const data = (response as unknown as { data: Record<string, unknown> }).data;
    expect(data.reminder_days).toBe(7);
    expect(data.tuv_enabled).toBe(true);
    expect(data.service_enabled).toBe(true);
    expect(data.email_enabled).toBe(true);
  });

  it("returns 400 for invalid preferences on PUT", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });

    const { PUT } = await import("./preferences/route");
    const request = new Request("http://localhost/api/push/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminder_days: 99 }),
    });

    const response = await PUT(request);
    expect((response as unknown as { status: number }).status).toBe(400);
  });

  it("saves valid preferences", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mockFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    const { PUT } = await import("./preferences/route");
    const request = new Request("http://localhost/api/push/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reminder_days: 14,
        tuv_enabled: true,
        service_enabled: false,
        email_enabled: true,
      }),
    });

    const response = await PUT(request);
    expect((response as unknown as { status: number }).status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith("notification_preferences");
  });
});
