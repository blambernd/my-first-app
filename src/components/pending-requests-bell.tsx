"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  Car,
  CheckCircle,
  Loader2,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ROLE_LABELS, type InviteRole } from "@/lib/validations/member";

interface PendingTransfer {
  id: string;
  token: string;
  vehicle_name: string;
  expires_at: string;
}

interface PendingInvitation {
  id: string;
  token: string;
  role: InviteRole;
  vehicle_name: string;
  expires_at: string;
}

interface PendingRequestsBellProps {
  mobileLabel?: string;
}

export function PendingRequestsBell({ mobileLabel }: PendingRequestsBellProps = {}) {
  const router = useRouter();
  const [transfers, setTransfers] = useState<PendingTransfer[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/pending-requests");
      if (!res.ok) return;
      const data = await res.json();
      setTransfers(data.transfers ?? []);
      setInvitations(data.invitations ?? []);
    } catch {
      // silently fail
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const totalCount = transfers.length + invitations.length;

  const handleAcceptTransfer = async (transfer: PendingTransfer) => {
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
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Fehler beim Annehmen des Transfers"
      );
    } finally {
      setAcceptingId(null);
    }
  };

  const handleAcceptInvitation = async (invitation: PendingInvitation) => {
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
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Fehler beim Annehmen der Einladung"
      );
    } finally {
      setAcceptingId(null);
    }
  };

  // Don't render until loaded, and hide if nothing pending
  if (!loaded || totalCount === 0) return null;

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
    >
      <Inbox className="h-4 w-4" />
      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white">
        {totalCount > 9 ? "9+" : totalCount}
      </span>
    </Button>
  );

  return (
    <div className={mobileLabel ? "flex flex-col items-center justify-center gap-0.5 min-w-[64px] h-full px-2 text-[10px] font-medium text-muted-foreground" : undefined}>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-medium">Offene Anfragen</h3>
        </div>
        <ScrollArea className="max-h-80">
          <div className="divide-y">
            {transfers.map((transfer) => (
              <div
                key={transfer.id}
                className="px-4 py-3 flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {transfer.vehicle_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fahrzeug-Transfer
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  onClick={() => handleAcceptTransfer(transfer)}
                  disabled={acceptingId === transfer.id}
                >
                  {acceptingId === transfer.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Annehmen"
                  )}
                </Button>
              </div>
            ))}
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="px-4 py-3 flex items-center gap-3"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Car className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {invitation.vehicle_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Einladung als {ROLE_LABELS[invitation.role]}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  onClick={() => handleAcceptInvitation(invitation)}
                  disabled={acceptingId === invitation.id}
                >
                  {acceptingId === invitation.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Annehmen"
                  )}
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
    {mobileLabel && <span className="-mt-0.5">{mobileLabel}</span>}
    </div>
  );
}
