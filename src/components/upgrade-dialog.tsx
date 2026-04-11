"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, Loader2, Bell, BellRing } from "lucide-react";
import { toast } from "sonner";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const isMvpMode = process.env.NEXT_PUBLIC_MVP_MODE === "true";

const features = [
  "Unbegrenzte Fahrzeuge",
  "5 GB Speicher",
  "Verkaufsassistent",
  "Marktpreis-Analyse",
  "Prioritäts-Support",
];

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [onWaitlist, setOnWaitlist] = useState(false);
  const [justJoined, setJustJoined] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    if (open && isMvpMode) {
      fetch("/api/waitlist")
        .then((res) => res.json())
        .then((data) => setOnWaitlist(data.onWaitlist))
        .catch(() => {});
    }
  }, [open]);

  const handleJoinWaitlist = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", { method: "POST" });
      if (res.ok) {
        setOnWaitlist(true);
        setJustJoined(true);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: isYearly ? "year" : "month" }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Fehler beim Starten des Checkouts.";
        toast.error(msg);
        alert(msg);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Keine Checkout-URL erhalten. Bitte versuche es erneut.");
        alert("Keine Checkout-URL erhalten. Bitte versuche es erneut.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verbindungsfehler";
      toast.error(msg);
      alert(`Checkout-Fehler: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            {isMvpMode ? "Premium — Coming Soon" : "Upgrade auf Premium"}
          </DialogTitle>
          <DialogDescription>
            {isMvpMode
              ? "Wir arbeiten an der Premium-Version. Trage dich in die Interessentenliste ein und wir benachrichtigen dich zum Launch."
              : "Schalte alle Funktionen frei und dokumentiere unbegrenzt viele Fahrzeuge."}
          </DialogDescription>
        </DialogHeader>

        {/* Features */}
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        {isMvpMode ? (
          <>
            {/* Waitlist CTA */}
            {onWaitlist ? (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-center">
                <BellRing className="h-5 w-5 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800">
                  {justJoined
                    ? "Du wurdest zur Interessentenliste hinzugefügt!"
                    : "Du bist bereits auf der Interessentenliste."}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Wir benachrichtigen dich per E-Mail, sobald Premium verfügbar ist.
                </p>
              </div>
            ) : (
              <Button
                onClick={handleJoinWaitlist}
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 mt-2"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                Benachrichtigt werden
              </Button>
            )}
            <p className="text-xs text-center text-muted-foreground">
              Kostenlos und unverbindlich. Kein Spam.
            </p>
          </>
        ) : (
          <>
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 rounded-full border p-1 bg-muted/50">
              <button
                onClick={() => setIsYearly(false)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  !isYearly
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Monatlich
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isYearly
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Jährlich
                <span className="ml-1.5 text-xs text-green-600 font-medium">−17%</span>
              </button>
            </div>

            {/* Price */}
            <div className="text-center">
              <span className="text-3xl font-bold">
                {isYearly ? "4,17" : "4,99"} €
              </span>
              <span className="text-muted-foreground ml-1">/Monat</span>
              {isYearly && (
                <p className="text-xs text-muted-foreground mt-1">
                  49,99 €/Jahr (2 Monate gratis)
                </p>
              )}
            </div>

            {/* Checkout CTA */}
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600"
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Crown className="h-4 w-4 mr-2" />
              )}
              Jetzt upgraden
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Jederzeit kündbar. Sichere Zahlung über Stripe.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
