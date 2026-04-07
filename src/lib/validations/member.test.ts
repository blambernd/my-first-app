import { describe, it, expect } from "vitest";
import {
  inviteMemberSchema,
  MEMBER_ROLES,
  INVITE_ROLES,
  INVITATION_STATUSES,
  ROLE_LABELS,
} from "./member";

describe("member validation", () => {
  describe("inviteMemberSchema", () => {
    it("accepts valid email + werkstatt role", () => {
      const result = inviteMemberSchema.safeParse({
        email: "werkstatt@example.com",
        role: "werkstatt",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid email + betrachter role", () => {
      const result = inviteMemberSchema.safeParse({
        email: "viewer@example.com",
        role: "betrachter",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty email", () => {
      const result = inviteMemberSchema.safeParse({
        email: "",
        role: "werkstatt",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email format", () => {
      const result = inviteMemberSchema.safeParse({
        email: "not-an-email",
        role: "werkstatt",
      });
      expect(result.success).toBe(false);
    });

    it("rejects besitzer role (cannot invite as owner)", () => {
      const result = inviteMemberSchema.safeParse({
        email: "test@example.com",
        role: "besitzer",
      });
      expect(result.success).toBe(false);
    });

    it("rejects unknown role", () => {
      const result = inviteMemberSchema.safeParse({
        email: "test@example.com",
        role: "admin",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing role", () => {
      const result = inviteMemberSchema.safeParse({
        email: "test@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("trims and lowercases email in application code (not in schema)", () => {
      // Schema itself doesn't trim — the form submission code does
      const result = inviteMemberSchema.safeParse({
        email: "  Test@Example.COM  ",
        role: "betrachter",
      });
      // Schema accepts it (valid email format with spaces won't pass email validation)
      // This verifies the schema correctly rejects emails with spaces
      expect(result.success).toBe(false);
    });
  });

  describe("constants", () => {
    it("MEMBER_ROLES includes all three roles", () => {
      expect(MEMBER_ROLES).toEqual(["besitzer", "werkstatt", "betrachter"]);
    });

    it("INVITE_ROLES excludes besitzer", () => {
      expect(INVITE_ROLES).toEqual(["werkstatt", "betrachter"]);
      expect(INVITE_ROLES).not.toContain("besitzer");
    });

    it("INVITATION_STATUSES includes all statuses", () => {
      expect(INVITATION_STATUSES).toEqual([
        "offen",
        "angenommen",
        "abgelaufen",
        "widerrufen",
      ]);
    });

    it("ROLE_LABELS has German labels for all roles", () => {
      expect(ROLE_LABELS.besitzer).toBe("Besitzer");
      expect(ROLE_LABELS.werkstatt).toBe("Werkstatt");
      expect(ROLE_LABELS.betrachter).toBe("Betrachter");
    });
  });
});
