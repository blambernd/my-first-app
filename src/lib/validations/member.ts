import { z } from "zod";

export const MEMBER_ROLES = ["besitzer", "werkstatt", "betrachter"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const INVITE_ROLES = ["werkstatt", "betrachter"] as const;
export type InviteRole = (typeof INVITE_ROLES)[number];

export const INVITATION_STATUSES = ["offen", "angenommen", "abgelaufen", "widerrufen"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const ROLE_LABELS: Record<MemberRole, string> = {
  besitzer: "Besitzer",
  werkstatt: "Werkstatt",
  betrachter: "Betrachter",
};

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .min(1, "E-Mail ist erforderlich")
    .email("Ungültige E-Mail-Adresse"),
  role: z.enum(INVITE_ROLES, { message: "Rolle ist erforderlich" }),
  can_edit_all: z.boolean().optional(),
});

export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;

export interface VehicleMember {
  id: string;
  vehicle_id: string;
  user_id: string;
  role: MemberRole;
  can_edit_all: boolean;
  joined_at: string;
  user_email?: string;
}

export interface VehicleInvitation {
  id: string;
  vehicle_id: string;
  email: string;
  token: string;
  role: InviteRole;
  can_edit_all: boolean;
  invited_by: string;
  expires_at: string;
  status: InvitationStatus;
  created_at: string;
}
