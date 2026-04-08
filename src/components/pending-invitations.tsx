"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Mail,
  Clock,
  X,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  Ban,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase";
import { ROLE_LABELS, type VehicleInvitation } from "@/lib/validations/member";

interface PendingInvitationsProps {
  vehicleId: string;
  vehicleName: string;
  invitations: VehicleInvitation[];
  onUpdate: () => void;
}

const PAST_STATUS_CONFIG = {
  angenommen: { icon: CheckCircle, color: "text-green-600", badge: "bg-green-100 text-green-800", label: "Angenommen" },
  widerrufen: { icon: Ban, color: "text-muted-foreground", badge: "bg-gray-100 text-gray-800", label: "Widerrufen" },
  abgelaufen: { icon: XCircle, color: "text-red-600", badge: "bg-red-100 text-red-800", label: "Abgelaufen" },
} as const;

export function PendingInvitations({
  vehicleId,
  vehicleName,
  invitations,
  onUpdate,
}: PendingInvitationsProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const openInvitations = invitations.filter((inv) => inv.status === "offen");
  const pastInvitations = invitations.filter((inv) => inv.status !== "offen");

  const handleRevoke = async (invitationId: string) => {
    setRevokingId(invitationId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("vehicle_invitations")
        .update({ status: "widerrufen" })
        .eq("id", invitationId);

      if (error) throw error;
      toast.success("Einladung widerrufen");
      onUpdate();
    } catch {
      toast.error("Fehler beim Widerrufen der Einladung");
    } finally {
      setRevokingId(null);
    }
  };

  const handleResendEmail = async (invitation: VehicleInvitation) => {
    setResendingId(invitation.id);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/invitations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: invitation.token,
          email: invitation.email,
          role: invitation.role,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("E-Mail erneut gesendet!");
    } catch {
      toast.error("E-Mail konnte nicht gesendet werden");
    } finally {
      setResendingId(null);
    }
  };

  const handleCopyLink = async (invitation: VehicleInvitation) => {
    const link = `${window.location.origin}/invite/${invitation.token}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(invitation.id);
    toast.success("Link kopiert!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (openInvitations.length === 0 && pastInvitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Open invitations */}
      {openInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offene Einladungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {openInvitations.map((invitation) => {
                const expiresAt = new Date(invitation.expires_at);
                const isExpired = expiresAt < new Date();
                const daysLeft = Math.max(
                  0,
                  Math.ceil(
                    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )
                );
                const inviteLink = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${invitation.token}`;

                return (
                  <div key={invitation.id} className="py-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                          <Mail className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {invitation.email}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge
                              variant="outline"
                              className="text-xs font-normal"
                            >
                              {ROLE_LABELS[invitation.role]}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {isExpired
                                ? "Abgelaufen"
                                : `Noch ${daysLeft} Tag${daysLeft !== 1 ? "e" : ""}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Link + actions */}
                    <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2 ml-12">
                      <code className="flex-1 text-xs truncate">
                        {inviteLink}
                      </code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleCopyLink(invitation)}
                      >
                        {copiedId === invitation.id ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>

                    <div className="flex gap-2 ml-12">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendEmail(invitation)}
                        disabled={resendingId === invitation.id}
                      >
                        {resendingId === invitation.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <Mail className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {resendingId === invitation.id
                          ? "Wird gesendet..."
                          : "E-Mail erneut senden"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleRevoke(invitation.id)}
                        disabled={revokingId === invitation.id}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Widerrufen
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past invitations */}
      {pastInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Einladungs-Verlauf</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {pastInvitations.map((inv) => {
                const config =
                  PAST_STATUS_CONFIG[
                    inv.status as keyof typeof PAST_STATUS_CONFIG
                  ];
                const Icon = config?.icon ?? Ban;
                return (
                  <div
                    key={inv.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${config?.color ?? "text-muted-foreground"}`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm truncate">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inv.created_at).toLocaleDateString("de-DE")}{" "}
                          · {ROLE_LABELS[inv.role]}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={`${config?.badge ?? "bg-gray-100 text-gray-800"} border-0 text-xs shrink-0`}
                    >
                      {config?.label ?? inv.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
