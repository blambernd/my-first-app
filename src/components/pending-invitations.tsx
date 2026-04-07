"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { ROLE_LABELS, type VehicleInvitation } from "@/lib/validations/member";

interface PendingInvitationsProps {
  invitations: VehicleInvitation[];
  onUpdate: () => void;
}

export function PendingInvitations({ invitations, onUpdate }: PendingInvitationsProps) {
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const openInvitations = invitations.filter((inv) => inv.status === "offen");

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

  if (openInvitations.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground/60 mb-3">
        Offene Einladungen
      </h3>
      <div className="divide-y">
        {openInvitations.map((invitation) => {
          const expiresAt = new Date(invitation.expires_at);
          const isExpired = expiresAt < new Date();
          const daysLeft = Math.ceil(
            (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          return (
            <div
              key={invitation.id}
              className="flex items-center justify-between py-3 gap-4"
            >
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
                        : `Noch ${daysLeft} Tag${daysLeft !== 1 ? "e" : ""} gültig`}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => handleRevoke(invitation.id)}
                disabled={revokingId === invitation.id}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Widerrufen
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
