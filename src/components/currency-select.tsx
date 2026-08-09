"use client";

import { forwardRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { createClient } from "@/lib/supabase";
import { CURRENCIES, formatMoney, type Currency } from "@/lib/currency";

/**
 * Auswahlfeld für die Fahrzeugwährung, mit Warnung vor dem Wechsel (PROJ-36).
 *
 * Die Warnung ist der eigentliche Zweck dieser Komponente. Ein Auswahlfeld
 * allein wäre eine Zeile im Formular gewesen — aber ein Wechsel bei bereits
 * erfassten Beträgen ist die eine Stelle, an der ein Missverständnis stillen
 * Schaden anrichtet: Der Nutzer erwartet eine Umrechnung, bekommt aber nur
 * eine neue Beschriftung, und aus 1.000 € werden 1.000 CHF.
 */

/**
 * Die Stellen, an denen ein Fahrzeug Geldbeträge sammelt.
 *
 * Die Zahl aus diesen Tabellen macht die Warnung überhaupt überzeugend:
 * „Einige Einträge sind betroffen" liest niemand zu Ende, „47 Einträge sind
 * betroffen" schon. Eine **zu niedrige** Zahl schwächt deshalb genau das,
 * wofür die Warnung da ist — sie muss vollständig sein.
 *
 * `vehicle_purchase_costs` (die Nebenkosten zum Kaufpreis) fehlte bis zum
 * 2026-08-09 (QA BUG-4): Wer Kaufpreis und drei Nebenkosten erfasst hatte,
 * las „1 erfasster Betrag", während vier neu beschriftet wurden.
 *
 * `market_analyses` steht bewusst **nicht** hier: Diese Preise stammen aus dem
 * deutschen Markt und bleiben Euro (siehe EXTERNAL_CURRENCY), ein
 * Währungswechsel am Fahrzeug berührt sie nicht.
 */
const GELD_TABELLEN = [
  { tabelle: "fuel_entries", spalte: "vehicle_id" },
  { tabelle: "recurring_costs", spalte: "vehicle_id" },
  { tabelle: "one_off_costs", spalte: "vehicle_id" },
  { tabelle: "vehicle_purchases", spalte: "vehicle_id" },
  { tabelle: "vehicle_purchase_costs", spalte: "vehicle_id" },
  { tabelle: "vehicle_market_values", spalte: "vehicle_id" },
] as const;

interface CurrencySelectProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  /**
   * Nur im Bearbeiten-Modus gesetzt. Fehlt die Kennung, ist das Fahrzeug neu
   * — dann gibt es nichts, wovor gewarnt werden müsste.
   */
  vehicleId?: string;
  disabled?: boolean;
  /**
   * Die Eigenschaften, die `FormControl` beisteuert (QA BUG-1).
   *
   * `FormControl` ist ein Radix-`Slot`: Es setzt `id`, `aria-describedby` und
   * `aria-invalid` auf sein Kind und verbindet damit Beschriftung, Erläuterung
   * und Fehlermeldung mit dem Feld. Bei allen anderen Feldern des Formulars
   * ist dieses Kind der `SelectTrigger` selbst. Hier liegt diese Komponente
   * dazwischen — nimmt sie die Eigenschaften nicht entgegen, **fallen sie
   * still zu Boden**, und ein Screenreader meldet ein unbeschriftetes
   * Auswahlfeld bei einer Pflichtangabe.
   *
   * Deshalb werden sie ausdrücklich angenommen und an den Auslöser
   * weitergereicht. Aus demselben Grund `forwardRef`: Der `Slot` gibt eine
   * Referenz mit, und eine Funktionskomponente ohne `forwardRef` verwirft sie.
   */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export const CurrencySelect = forwardRef<
  HTMLButtonElement,
  CurrencySelectProps
>(function CurrencySelect(
  {
    value,
    onChange,
    vehicleId,
    disabled,
    id,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
  },
  ref
) {
  const [pending, setPending] = useState<Currency | null>(null);
  const [betroffen, setBetroffen] = useState<number>(0);
  const [pruefe, setPruefe] = useState(false);

  // Der Name lautet bewusst nicht `id`: Diese Komponente hat seit QA BUG-1
  // eine Eigenschaft `id` (die des Formularfelds). Ein gleichnamiger Parameter
  // verdeckte sie hier — beides sind Kennungen, und eine Verwechslung wäre
  // beim Lesen nicht zu sehen.
  async function zaehleBetraege(fahrzeugId: string): Promise<number> {
    const supabase = createClient();

    // Scheckheft-Einträge zählen nur mit Kostenangabe — ein Eintrag ohne
    // Betrag ist von einem Währungswechsel nicht betroffen.
    const abfragen = [
      ...GELD_TABELLEN.map(({ tabelle, spalte }) =>
        supabase
          .from(tabelle)
          .select("id", { count: "exact", head: true })
          .eq(spalte, fahrzeugId)
      ),
      supabase
        .from("service_entries")
        .select("id", { count: "exact", head: true })
        .eq("vehicle_id", fahrzeugId)
        .not("cost_cents", "is", null),
    ];

    const ergebnisse = await Promise.all(abfragen);
    return ergebnisse.reduce((summe, r) => summe + (r.count ?? 0), 0);
  }

  async function handleSelect(neu: Currency) {
    if (neu === value) return;

    // Neues Fahrzeug: nichts erfasst, nichts zu warnen.
    if (!vehicleId) {
      onChange(neu);
      return;
    }

    setPruefe(true);
    let anzahl = 0;
    try {
      anzahl = await zaehleBetraege(vehicleId);
    } catch {
      // Scheitert das Zählen, wird trotzdem gewarnt — nur ohne Zahl. Den
      // Wechsel deshalb zu verweigern wäre die schlechtere Antwort: Der
      // Nutzer käme dann gar nicht mehr an seine Einstellung.
      anzahl = -1;
    } finally {
      setPruefe(false);
    }

    if (anzahl === 0) {
      onChange(neu);
      return;
    }

    setBetroffen(anzahl);
    setPending(neu);
  }

  const beispielAlt = formatMoney(100000, value);
  const beispielNeu = pending ? formatMoney(100000, pending) : "";

  return (
    <>
      <Select
        value={value}
        onValueChange={(v) => handleSelect(v as Currency)}
        disabled={disabled || pruefe}
      >
        <SelectTrigger
          ref={ref}
          id={id}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map(({ code, name }) => (
            <SelectItem key={code} value={code}>
              {/* Code und Klartext: „kr" allein steht für drei verschiedene
                  Kronen, und „$" für mehr als eine Währung. */}
              <span className="flex items-baseline gap-2">
                <span className="font-medium">{code}</span>
                <span className="text-muted-foreground">{name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(offen) => {
          if (!offen) setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Beträge werden nicht umgerechnet
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Es ändert sich nur die Beschriftung. Aus{" "}
                  <strong className="text-foreground">{beispielAlt}</strong>{" "}
                  wird{" "}
                  <strong className="text-foreground">{beispielNeu}</strong> —
                  dieselbe Zahl, eine andere Währung.
                </p>
                <p>
                  {betroffen > 0 ? (
                    <>
                      Betroffen{" "}
                      {betroffen === 1
                        ? "ist 1 erfasster Betrag"
                        : `sind ${betroffen.toLocaleString(
                            "de-DE"
                          )} erfasste Beträge`}
                      : Tankbuch, laufende Kosten, Einzelkosten,
                      Scheckheft-Kosten, Kaufpreis samt Nebenkosten und
                      Marktwerte.
                    </>
                  ) : (
                    // Zählen fehlgeschlagen — dann lieber ohne Zahl warnen als
                    // gar nicht.
                    <>
                      Betroffen sind alle bereits erfassten Beträge dieses
                      Fahrzeugs.
                    </>
                  )}
                </p>
                <p>
                  Die Anwendung rechnet bewusst keine Kurse: Ein umgerechneter
                  Wert stünde als gerundete Schätzung neben deinen belegten
                  Rechnungsbeträgen, ohne dass man beiden ansieht, welcher
                  welcher ist.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) onChange(pending);
                setPending(null);
              }}
            >
              Trotzdem ändern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
