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

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

  useEffect(() => {
    if (open) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Premium — Coming Soon
          </DialogTitle>
          <DialogDescription>
            Wir arbeiten an der Premium-Version. Trage dich in die Interessentenliste ein und wir benachrichtigen dich zum Launch.
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

        {/* CTA */}
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
      </DialogContent>
    </Dialog>
  );
}
