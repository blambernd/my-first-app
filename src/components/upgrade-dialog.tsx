"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Loader2 } from "lucide-react";

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
  const [interval, setInterval] = useState<"month" | "year">("year");
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Upgrade auf Premium
          </DialogTitle>
          <DialogDescription>
            Nutze alle Features von Oldtimer Docs ohne Einschränkungen.
          </DialogDescription>
        </DialogHeader>

        {/* Interval selector */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setInterval("month")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              interval === "month"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monatlich
          </button>
          <button
            onClick={() => setInterval("year")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors relative ${
              interval === "year"
                ? "bg-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Jährlich
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 text-[10px] px-1 bg-green-100 text-green-700 border-green-200"
            >
              -17%
            </Badge>
          </button>
        </div>

        {/* Price */}
        <div className="text-center py-2">
          <div className="text-3xl font-bold">
            {interval === "month" ? "4,99 €" : "49,99 €"}
          </div>
          <div className="text-sm text-muted-foreground">
            {interval === "month" ? "pro Monat" : "pro Jahr (4,17 €/Monat)"}
          </div>
        </div>

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
        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 mt-2"
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
          Sichere Zahlung über Stripe. Jederzeit kündbar.
        </p>
      </DialogContent>
    </Dialog>
  );
}
