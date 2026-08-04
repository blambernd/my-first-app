"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CONDITION_GRADES } from "@/lib/validations/vehicle";
import {
  ablehnungsText,
  pruefeFuerAuswertung,
  type SaleReportInput,
} from "@/lib/validations/sale-report";

export interface TransferPurchaseFormProps {
  wert: SaleReportInput;
  onChange: (wert: SaleReportInput) => void;
  /**
   * Zustandsnote des Fahrzeugs, falls hinterlegt.
   *
   * Ist sie bekannt, entfällt die Frage — der Käufer soll nicht angeben
   * müssen, was schon dasteht.
   */
  vorhandeneZustandsnote?: number | null;
  /** Letzter bekannter Kilometerstand zum Vorbelegen */
  letzterKmStand?: number | null;
  disabled?: boolean;
}

/**
 * Kaufpreis und Einwilligung beim Annehmen einer Übergabe (PROJ-33).
 *
 * Steht **vor** den Schaltflächen, weil der Datenpunkt in derselben
 * Transaktion entstehen soll wie der Besitzerwechsel: Die Angaben müssen beim
 * Klick bereits bekannt sein.
 *
 * **Nichts hier ist Pflicht.** Wer nur übernehmen will, klickt weiter, ohne
 * ein Feld anzufassen — die Frage darf kein Hindernis für die Übergabe sein.
 */
export function TransferPurchaseForm({
  wert,
  onChange,
  vorhandeneZustandsnote,
  letzterKmStand,
  disabled,
}: TransferPurchaseFormProps) {
  const [detailsOffen, setDetailsOffen] = useState(false);

  const setze = (teil: Partial<SaleReportInput>) =>
    onChange({ ...wert, ...teil });

  const frageZustandsnote =
    vorhandeneZustandsnote === null || vorhandeneZustandsnote === undefined;

  // Nur prüfen, wenn der Nutzer die Weitergabe überhaupt will — sonst wäre der
  // Hinweis eine Belehrung über etwas, das er nicht vorhat.
  const grund = wert.share_anonymously ? pruefeFuerAuswertung(wert) : null;

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div>
        <p className="text-sm font-medium">Dein Kaufpreis</p>
        <p className="text-sm text-muted-foreground">
          Freiwillig. Trägst du ihn ein, stimmt deine Wertentwicklung von
          Anfang an — die Übergabe funktioniert auch ohne.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="kaufpreis">Kaufpreis (€)</Label>
          <Input
            id="kaufpreis"
            type="number"
            inputMode="decimal"
            min={0}
            step="100"
            placeholder="z. B. 18500"
            disabled={disabled}
            value={wert.purchase_price_eur ?? ""}
            onChange={(e) =>
              setze({
                purchase_price_eur:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="kmstand">Kilometerstand</Label>
          <Input
            id="kmstand"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={
              letzterKmStand != null
                ? letzterKmStand.toLocaleString("de-DE")
                : "z. B. 52000"
            }
            disabled={disabled}
            value={wert.mileage_km ?? ""}
            onChange={(e) =>
              setze({
                mileage_km:
                  e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
          />
        </div>

        {/* Nur fragen, wenn am Fahrzeug nichts hinterlegt ist */}
        {frageZustandsnote && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="zustandsnote">Zustandsnote</Label>
            <Select
              disabled={disabled}
              value={
                wert.condition_grade ? String(wert.condition_grade) : undefined
              }
              onValueChange={(v) => setze({ condition_grade: Number(v) })}
            >
              <SelectTrigger id="zustandsnote">
                <SelectValue placeholder="Zustand einschätzen" />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_GRADES.map((g) => (
                  <SelectItem key={g.value} value={String(g.value)}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Am Fahrzeug ist keine hinterlegt. Du hast es gerade gesehen und
              kannst den Zustand am besten einschätzen.
            </p>
          </div>
        )}
      </div>

      {/* Die Einwilligung ist bewusst getrennt und NIE vorbelegt: Sie betrifft
          die Weitergabe, nicht die eigene Erfassung. */}
      <div className="space-y-2 border-t pt-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="weitergabe"
            disabled={disabled}
            checked={wert.share_anonymously}
            onCheckedChange={(c) => setze({ share_anonymously: c === true })}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label
              htmlFor="weitergabe"
              className="text-sm font-normal leading-snug"
            >
              Mein Kaufpreis darf <strong>anonym</strong> in die Preisübersicht
              einfließen und anderen Oldtimer-Besitzern als Orientierung dienen.
            </Label>

            <Collapsible open={detailsOffen} onOpenChange={setDetailsOffen}>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                Was genau gespeichert wird
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${detailsOffen ? "rotate-180" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 pt-2 text-xs text-muted-foreground">
                <p>
                  <strong>Gespeichert wird:</strong> Marke, Modell, Baujahr,
                  eine Kilometer-Spanne, die Zustandsnote, der Kaufpreis und
                  der Verkaufsmonat.
                </p>
                <p>
                  <strong>Nicht gespeichert wird:</strong> dein Name, dein
                  Konto, das Fahrzeug oder der Vorbesitzer. Der Eintrag lässt
                  sich weder dir noch diesem Fahrzeug zuordnen.
                </p>
                <p>
                  <strong>Ein einzelner Preis wird nie angezeigt.</strong> Die
                  Preisübersicht zeigt erst dann etwas, wenn genügend
                  vergleichbare Verkäufe vorliegen.
                </p>
                <p>
                  <strong>Der Eintrag lässt sich nicht widerrufen.</strong> Weil
                  er niemandem zuzuordnen ist, kann er auch nicht wiedergefunden
                  und gelöscht werden. Das ist die Kehrseite der Anonymität.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Verständliche Begründung statt stiller Ablehnung */}
        {grund && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {ablehnungsText(grund)}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
