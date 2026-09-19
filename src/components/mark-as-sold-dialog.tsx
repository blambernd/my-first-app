"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrencySymbol } from "@/lib/currency";
import { vehicleLabel } from "@/lib/vehicle-format";
import type { InventoryVehicle } from "@/lib/dealer-inventory";

interface MarkAsSoldDialogProps {
  vehicle: InventoryVehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * „Als verkauft kennzeichnen" (PROJ-38).
 *
 * Der zweite Weg aus dem Bestand, neben der Übergabe. Im Handel ist der
 * Käufer ohne Konto der Regelfall — ohne diesen Weg beschriebe die
 * Auswertung nur die Minderheit der Verkäufe.
 *
 * Auf die Übergabe wird hingewiesen, aber sie ist keine Bedingung: Sie gibt
 * dem Käufer die Historie mit und stützt damit den Fahrzeugwert.
 *
 * **Die Fahrzeugakte wird dabei nicht gelöscht.** Ob sie bleibt, entscheidet
 * der Händler getrennt — ein Verkauf ist kein Grund, Belege wegzuwerfen.
 */
export function MarkAsSoldDialog({
  vehicle,
  open,
  onOpenChange,
}: MarkAsSoldDialogProps) {
  const router = useRouter();
  const heute = new Date().toISOString().split("T")[0];

  const [soldOn, setSoldOn] = useState(heute);
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  if (!vehicle) return null;

  const symbol = getCurrencySymbol(vehicle.currency);

  const speichern = async () => {
    if (!soldOn) {
      toast.error("Bitte ein Verkaufsdatum angeben");
      return;
    }
    if (vehicle.purchasedOn && soldOn < vehicle.purchasedOn) {
      // Sonst entstünde eine negative Standzeit.
      toast.error("Das Verkaufsdatum liegt vor dem Kaufdatum");
      return;
    }

    setSaving(true);
    try {
      const antwort = await fetch("/api/dealer/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          sold_on: soldOn,
          sale_price_eur: price === "" ? undefined : Number(price),
        }),
      });

      if (!antwort.ok) throw new Error(await antwort.text());

      toast.success("Fahrzeug als verkauft gekennzeichnet");
      onOpenChange(false);
      setPrice("");
      router.refresh();
    } catch {
      toast.error("Konnte nicht gespeichert werden");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Als verkauft kennzeichnen</DialogTitle>
          <DialogDescription>{vehicleLabel(vehicle)}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sold-on">Verkaufsdatum *</Label>
            <Input
              id="sold-on"
              type="date"
              value={soldOn}
              max={heute}
              onChange={(e) => setSoldOn(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale-price">Verkaufserlös ({symbol})</Label>
            <Input
              id="sale-price"
              type="number"
              inputMode="decimal"
              placeholder="freiwillig"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Ohne Erlös bleibt der Vorgang erhalten, nur die Spanne entfällt.
            </p>
          </div>

          <div className="flex gap-2 rounded-md border bg-muted/40 p-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Hat der Käufer ein Konto, gibt die{" "}
              <Link
                href={`/vehicles/${vehicle.id}/transfer`}
                className="underline"
              >
                Fahrzeugübergabe
              </Link>{" "}
              ihm die vollständige Historie mit — das stützt den Wert des
              Fahrzeugs. Die Akte bleibt hier in beiden Fällen erhalten.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Abbrechen
          </Button>
          <Button onClick={speichern} disabled={saving}>
            Kennzeichnen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
