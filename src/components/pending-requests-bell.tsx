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
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase";
import { ROLE_LABELS, type InviteRole } from "@/lib/validations/member";

interface PendingTransfer {
  id: string;
  token: string;
  vehicle_id: string;
  expires_at: string;
  vehicles: { make: string; model: string } | null;
}

interface PendingInvitation {
  id: string;
  token: string;
  role: InviteRole;
  vehicle_id: string;
  expires_at: string;
  vehicles: { make: string; model: string } | null;
}

export function PendingRequestsBell() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<PendingTransfer[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const fetchPending = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get user's own vehicle IDs to filter them out
    const { data: ownedVehicles } = await supabase
      .from("vehicles")
      .select("id")
      .eq("user_id", user.id);
    const ownedIds = new Set((ownedVehicles ?? []).map((v) => v.id));

    // Fetch open transfers (RLS filters to user's email + owned vehicles)
    const { data: rawTransfers } = await supabase
      .from("vehicle_transfers")
      .select("id, token, vehicle_id, expires_at, vehicles(make, model)")
      .eq("status", "offen")
      .gt("expires_at", new Date().toISOString());

    setTransfers(
      (rawTransfers ?? [])
        .filter((t) => !ownedIds.has(t.vehicle_id))
        .map((t) => ({
          ...t,
          vehicles: t.vehicles as unknown as { make: string; model: string } | null,
        }))
    );

    // Fetch open invitations (RLS filters to user's email + owned vehicles)
    const { data: rawInvitations } = await supabase
      .from("vehicle_invitations")
      .select("id, token, role, vehicle_id, expires_at, vehicles(make, model)")
      .eq("status", "offen")
      .gt("expires_at", new Date().toISOString());

    setInvitations(
      (rawInvitations ?? [])
        .filter((inv) => !ownedIds.has(inv.vehicle_id))
        .map((inv) => ({
          ...inv,
          role: inv.role as InviteRole,
          vehicles: inv.vehicles as unknown as { make: string; model: string } | null,
        }))
    );
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
      const name = transfer.vehicles
        ? `${transfer.vehicles.make} ${transfer.vehicles.model}`
        : "Fahrzeug";
      toast.success(`Transfer für ${name} angenommen!`);
      setTransfers((prev) => prev.filter((t) => t.id !== transfer.id));
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
      const name = invitation.vehicles
        ? `${invitation.vehicles.make} ${invitation.vehicles.model}`
        : "Fahrzeug";
      toast.success(`Einladung für ${name} angenommen!`);
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
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

  if (totalCount === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-medium">Offene Anfragen</h3>
        </div>
        <ScrollArea className="max-h-80">
          <div className="divide-y">
            {transfers.map((transfer) => {
              const name = transfer.vehicles
                ? `${transfer.vehicles.make} ${transfer.vehicles.model}`
                : "Fahrzeug";
              return (
                <div
                  key={transfer.id}
                  className="px-4 py-3 flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
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
              );
            })}
            {invitations.map((invitation) => {
              const name = invitation.vehicles
                ? `${invitation.vehicles.make} ${invitation.vehicles.model}`
                : "Fahrzeug";
              return (
                <div
                  key={invitation.id}
                  className="px-4 py-3 flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Car className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
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
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
