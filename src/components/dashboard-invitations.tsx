"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRightLeft, Car, CheckCircle, Loader2, Mail } from "lucide-react";
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
}

export interface DashboardTransfer {
  id: string;
  token: string;
  vehicle_name: string;
  expires_at: string;
  keep_as_viewer: boolean;
}

interface DashboardInvitationsProps {
  invitations: DashboardInvitation[];
  transfers: DashboardTransfer[];
}

export function DashboardInvitations({
  invitations: initialInvitations,
  transfers: initialTransfers,
}: DashboardInvitationsProps) {
  const router = useRouter();
  const [invitations, setInvitations] = useState(initialInvitations);
  const [transfers, setTransfers] = useState(initialTransfers);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  if (invitations.length === 0 && transfers.length === 0) return null;

  const handleAcceptInvitation = async (invitation: DashboardInvitation) => {
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

  const handleAcceptTransfer = async (transfer: DashboardTransfer) => {
    setAcceptingId(transfer.id);
    try {
      const res = await fetch(`/api/transfers/${transfer.token}/accept`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Annehmen");
      }
      toast.success(`Transfer für ${transfer.vehicle_name} angenommen!`);
      setTransfers((prev) => prev.filter((t) => t.id !== transfer.id));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Annehmen des Transfers");
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Offene Anfragen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Transfers */}
          {transfers.map((transfer) => {
            const expiresAt = new Date(transfer.expires_at);
            const daysLeft = Math.max(
              0,
              Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            );

            return (
              <div
                key={transfer.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{transfer.vehicle_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs font-normal border-blue-200 text-blue-700">
                        Fahrzeug-Transfer
                      </Badge>
                      <span>Noch {daysLeft} Tag{daysLeft !== 1 ? "e" : ""}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAcceptTransfer(transfer)}
                  disabled={acceptingId === transfer.id}
                >
                  {acceptingId === transfer.id ? (
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

          {/* Invitations */}
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
                  onClick={() => handleAcceptInvitation(inv)}
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
