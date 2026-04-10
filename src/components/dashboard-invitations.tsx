"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Car, CheckCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, type InviteRole } from "@/lib/validations/member";

export interface DashboardInvitation {
  id: string;
  token: string;
  vehicle_name: string;
  role: InviteRole;
  expires_at: string;
  invited_by_email: string;
}

interface DashboardInvitationsProps {
  invitations: DashboardInvitation[];
}

export function DashboardInvitations({ invitations: initialInvitations }: DashboardInvitationsProps) {
  const router = useRouter();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  if (invitations.length === 0) return null;

  const handleAccept = async (invitation: DashboardInvitation) => {
    setAcceptingId(invitation.id);
    try {
      const res = await fetch(`/api/invites/${invitation.token}/accept`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Annehmen");
      }

      toast.success(`Einladung für ${invitation.vehicle_name} angenommen!`);
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Annehmen der Einladung");
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Offene Einladungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((inv) => {
            const expiresAt = new Date(inv.expires_at);
            const daysLeft = Math.max(
              0,
              Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            );

            return (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Car className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{inv.vehicle_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs font-normal">
                        {ROLE_LABELS[inv.role]}
                      </Badge>
                      <span>Noch {daysLeft} Tag{daysLeft !== 1 ? "e" : ""}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAccept(inv)}
                  disabled={acceptingId === inv.id}
                >
                  {acceptingId === inv.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Annehmen
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
