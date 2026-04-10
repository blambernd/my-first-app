"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Clock, XCircle, CheckCircle, Ban, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  TRANSFER_STATUS_LABELS,
  type VehicleTransfer,
} from "@/lib/validations/transfer";

interface TransferStatusProps {
  transfer: VehicleTransfer;
  vehicleName?: string;
  onUpdate: () => void;
}

const STATUS_CONFIG = {
  offen: { icon: Clock, variant: "outline" as const, color: "text-yellow-600" },
  angenommen: { icon: CheckCircle, variant: "default" as const, color: "text-green-600" },
  abgelehnt: { icon: XCircle, variant: "destructive" as const, color: "text-red-600" },
  abgebrochen: { icon: Ban, variant: "secondary" as const, color: "text-muted-foreground" },
};

export function TransferStatus({ transfer, vehicleName, onUpdate }: TransferStatusProps) {
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resending, setResending] = useState(false);

  const config = STATUS_CONFIG[transfer.status];
  const StatusIcon = config.icon;
  const isExpired = new Date(transfer.expires_at) < new Date();
  const isActive = transfer.status === "offen" && !isExpired;

  const transferLink = `${typeof window !== "undefined" ? window.location.origin : ""}/transfer/${transfer.token}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(transferLink);
    setCopied(true);
    toast.success("Link kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  const cancelTransfer = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/transfers/${transfer.token}/cancel`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Abbrechen");
      }
      toast.success("Transfer abgebrochen");
      onUpdate();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Fehler beim Abbrechen des Transfers"
      );
    } finally {
      setCancelling(false);
    }
  };

  const resendEmail = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: transfer.token,
          email: transfer.to_email,
          vehicleName: vehicleName || "Fahrzeug-Transfer",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("E-Mail erneut gesendet!");
    } catch {
      toast.error("E-Mail konnte nicht gesendet werden");
    } finally {
      setResending(false);
    }
  };

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(transfer.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-5 w-5 ${config.color}`} />
          <span className="font-medium">Transfer</span>
          <Badge variant={config.variant}>
            {isActive
              ? TRANSFER_STATUS_LABELS[transfer.status]
              : isExpired && transfer.status === "offen"
                ? "Abgelaufen"
                : TRANSFER_STATUS_LABELS[transfer.status]}
          </Badge>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">An</span>
          <span>{transfer.to_email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Erstellt am</span>
          <span>{new Date(transfer.created_at).toLocaleDateString("de-DE")}</span>
        </div>
        {isActive && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gültig noch</span>
            <span>
              {daysLeft} {daysLeft === 1 ? "Tag" : "Tage"}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Als Betrachter bleiben</span>
          <span>{transfer.keep_as_viewer ? "Ja" : "Nein"}</span>
        </div>
      </div>

      {isActive && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
            <code className="flex-1 text-sm truncate">{transferLink}</code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copyLink}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={resendEmail}
            disabled={resending}
          >
            {resending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Mail className="h-4 w-4 mr-1.5" />
            )}
            {resending ? "Wird gesendet..." : "E-Mail erneut senden"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                disabled={cancelling}
              >
                Transfer abbrechen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Transfer abbrechen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Der Transfer-Link wird ungültig. Du kannst danach einen neuen
                  Transfer starten.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Zurück</AlertDialogCancel>
                <AlertDialogAction onClick={cancelTransfer} disabled={cancelling}>
                  {cancelling ? "Wird abgebrochen..." : "Ja, abbrechen"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
