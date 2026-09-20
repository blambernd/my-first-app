"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrencySymbol } from "@/lib/currency";
import type { SoldRecord } from "@/lib/dealer-inventory";

interface DealerSaleActionsProps {
  record: SoldRecord;
  label: string;
}

/**
 * Erlös nachtragen und Vorgang zurücknehmen (PROJ-38, QA BUG-3 und BUG-4).
 *
 * Beides sind Kriterien der Spezifikation, die bis dahin keine Oberfläche
 * hatten: Wer beim Kennzeichnen keinen Erlös angab oder sich vertippte,
 * konnte das nicht mehr ändern, und ein Fehlklick war endgültig.
 *
 * Das Zurücknehmen entfernt **nur den Vorgang**. Das Fahrzeug bleibt
 * unberührt und kehrt allein dadurch in den Bestand zurück.
 */
export function DealerSaleActions({ record, label }: DealerSaleActionsProps) {
  const router = useRouter();
  const symbol = getCurrencySymbol(record.currency);

  const [erloesOffen, setErloesOffen] = useState(false);
  const [ruecknahmeOffen, setRuecknahmeOffen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preis, setPreis] = useState(
    record.salePriceCents != null ? String(record.salePriceCents / 100) : ""
  );

  const erloesSpeichern = async () => {
    setSaving(true);
    try {
      const antwort = await fetch(`/api/dealer/sales/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Leeres Feld heißt „kein Erlös" — der Vorgang bleibt, die Spanne
        // entfällt. Das ist etwas anderes als ein Erlös von null.
        body: JSON.stringify({
          sale_price_eur: preis === "" ? null : Number(preis),
        }),
      });

      if (!antwort.ok) throw new Error(await antwort.text());

      toast.success("Verkaufserlös gespeichert");
      setErloesOffen(false);
      router.refresh();
    } catch {
      toast.error("Konnte nicht gespeichert werden");
    } finally {
      setSaving(false);
    }
  };

  const zuruecknehmen = async () => {
    setSaving(true);
    try {
      const antwort = await fetch(`/api/dealer/sales/${record.id}`, {
        method: "DELETE",
      });

      if (!antwort.ok) throw new Error(await antwort.text());

      toast.success("Verkauf zurückgenommen — das Fahrzeug steht wieder im Bestand");
      setRuecknahmeOffen(false);
      router.refresh();
    } catch {
      toast.error("Konnte nicht zurückgenommen werden");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Aktionen für ${label}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setErloesOffen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            {record.salePriceCents != null
              ? "Erlös korrigieren"
              : "Erlös nachtragen"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setRuecknahmeOffen(true)}>
            <Undo2 className="mr-2 h-4 w-4" />
            Verkauf zurücknehmen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={erloesOffen} onOpenChange={setErloesOffen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verkaufserlös</DialogTitle>
            <DialogDescription>{label}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`erloes-${record.id}`}>
              Verkaufserlös ({symbol})
            </Label>
            <Input
              id={`erloes-${record.id}`}
              type="number"
              inputMode="decimal"
              placeholder="freiwillig"
              value={preis}
              onChange={(e) => setPreis(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leer lassen entfernt den Erlös wieder. Der Vorgang bleibt
              erhalten, nur die Spanne entfällt.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setErloesOffen(false)}
              disabled={saving}
            >
              Abbrechen
            </Button>
            <Button onClick={erloesSpeichern} disabled={saving}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={ruecknahmeOffen} onOpenChange={setRuecknahmeOffen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verkauf zurücknehmen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Vorgang zu {label} wird gelöscht. Das Fahrzeug selbst bleibt
              unberührt und erscheint wieder im Bestand — sofern es noch
              existiert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={zuruecknehmen} disabled={saving}>
              Zurücknehmen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
