import { describe, it, expect, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}));

vi.mock("./stripe", () => ({
  PLANS: {
    free: { name: "Free", maxVehicles: 1, maxStorageMb: 100 },
    premium: { name: "Premium", maxVehicles: Infinity, maxStorageMb: 5120 },
    trial: { name: "Trial", maxVehicles: Infinity, maxStorageMb: 5120 },
  },
}));

const { getEffectivePlan, canAddVehicle, canUpload, hasPremiumAccess } =
  await import("./subscription");

describe("getEffectivePlan", () => {
  it("returns 'trial' for active trial with future end date", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      getEffectivePlan({ plan: "trial", status: "trialing", trial_end: future })
    ).toBe("trial");
  });

  it("returns 'free' for expired trial", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(
      getEffectivePlan({ plan: "trial", status: "trialing", trial_end: past })
    ).toBe("free");
  });

  it("returns 'trial' when trial_end is null (shouldn't happen but safe)", () => {
    expect(
      getEffectivePlan({ plan: "trial", status: "trialing", trial_end: null })
    ).toBe("trial");
  });

  it("returns 'premium' for active premium subscription", () => {
    expect(
      getEffectivePlan({ plan: "premium", status: "active", trial_end: null })
    ).toBe("premium");
  });

  it("returns 'free' for canceled subscription", () => {
    expect(
      getEffectivePlan({ plan: "premium", status: "canceled", trial_end: null })
    ).toBe("free");
  });

  it("returns 'premium' for past_due within 7-day grace period", () => {
    const recentPastDue = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
    expect(
      getEffectivePlan({ plan: "premium", status: "past_due", trial_end: null, past_due_since: recentPastDue })
    ).toBe("premium");
  });

  it("returns 'free' for past_due after 7-day grace period", () => {
    const oldPastDue = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(); // 8 days ago
    expect(
      getEffectivePlan({ plan: "premium", status: "past_due", trial_end: null, past_due_since: oldPastDue })
    ).toBe("free");
  });

  it("returns 'free' for past_due without past_due_since timestamp", () => {
    expect(
      getEffectivePlan({ plan: "premium", status: "past_due", trial_end: null, past_due_since: null })
    ).toBe("free");
  });

  it("returns 'free' for free plan", () => {
    expect(
      getEffectivePlan({ plan: "free", status: "active", trial_end: null })
    ).toBe("free");
  });

  // Referral bonus tests
  it("returns 'premium' for expired trial with active referral bonus", () => {
    const pastTrial = new Date(Date.now() - 1000).toISOString();
    const futureBonus = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      getEffectivePlan({ plan: "trial", status: "trialing", trial_end: pastTrial, referral_bonus_until: futureBonus })
    ).toBe("premium");
  });

  it("returns 'free' for expired trial with expired referral bonus", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(
      getEffectivePlan({ plan: "trial", status: "trialing", trial_end: past, referral_bonus_until: past })
    ).toBe("free");
  });

  it("returns 'premium' for canceled subscription with active referral bonus", () => {
    const futureBonus = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      getEffectivePlan({ plan: "premium", status: "canceled", trial_end: null, referral_bonus_until: futureBonus })
    ).toBe("premium");
  });

  it("returns 'free' for canceled subscription with no referral bonus", () => {
    expect(
      getEffectivePlan({ plan: "premium", status: "canceled", trial_end: null, referral_bonus_until: null })
    ).toBe("free");
  });

  it("returns 'premium' for past_due after grace period with active referral bonus", () => {
    const oldPastDue = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const futureBonus = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      getEffectivePlan({ plan: "premium", status: "past_due", trial_end: null, past_due_since: oldPastDue, referral_bonus_until: futureBonus })
    ).toBe("premium");
  });

  it("returns 'trial' for active trial regardless of referral bonus", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const futureBonus = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      getEffectivePlan({ plan: "trial", status: "trialing", trial_end: future, referral_bonus_until: futureBonus })
    ).toBe("trial");
  });
});

describe("canAddVehicle", () => {
  it("allows adding first vehicle on free plan", () => {
    expect(canAddVehicle("free", 0)).toBe(true);
  });

  it("blocks adding second vehicle on free plan", () => {
    expect(canAddVehicle("free", 1)).toBe(false);
  });

  it("allows unlimited vehicles on premium plan", () => {
    expect(canAddVehicle("premium", 100)).toBe(true);
  });

  it("allows unlimited vehicles on trial plan", () => {
    expect(canAddVehicle("trial", 50)).toBe(true);
  });
});

describe("canUpload", () => {
  it("allows upload within free limit", () => {
    expect(canUpload("free", 50, 10)).toBe(true);
  });

  it("blocks upload exceeding free limit", () => {
    expect(canUpload("free", 95, 10)).toBe(false);
  });

  it("allows upload at exact limit", () => {
    expect(canUpload("free", 90, 10)).toBe(true);
  });

  it("allows large upload on premium plan", () => {
    expect(canUpload("premium", 4000, 500)).toBe(true);
  });

  it("blocks upload exceeding premium limit", () => {
    expect(canUpload("premium", 5000, 500)).toBe(false);
  });
});

describe("hasPremiumAccess", () => {
  it("returns true for premium", () => {
    expect(hasPremiumAccess("premium")).toBe(true);
  });

  it("returns true for trial", () => {
    expect(hasPremiumAccess("trial")).toBe(true);
  });

  it("returns false for free", () => {
    expect(hasPremiumAccess("free")).toBe(false);
  });
});
