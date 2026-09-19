import { Handshake, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/currency";
import { formatDate, vehicleLabel } from "@/lib/vehicle-format";
import {
  formatHoldingDays,
  grossMarginCents,
  soldStandingDays,
  summarizeSales,
  type SoldRecord,
} from "@/lib/dealer-inventory";

interface DealerSoldListProps {
  records: SoldRecord[];
}

/**
 * Abgeschlossene Verkäufe (PROJ-38).
 *
 * Diese Vorgänge überleben das Fahrzeug: Nach einer Übergabe liegt es beim
 * Käufer, und der Kaufpreis des Vorbesitzers wird dabei gelöscht (PROJ-32).
 * Was hier steht, ist eine Abschrift zum Verkaufszeitpunkt — deshalb führt
 * von hier auch kein Link mehr zur Fahrzeugakte.
 *
 * Die Spanne ist ausdrücklich eine **Rohspanne**: ohne Aufbereitung,
 * Reparaturen und Standkosten. Sie so zu benennen ist wichtiger, als sie
 * größer aussehen zu lassen.
 */
export function DealerSoldList({ records }: DealerSoldListProps) {
  const summen = summarizeSales(records);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <PackageCheck className="h-5 w-5 text-muted-foreground" />
          Verkauft
        </CardTitle>
      </CardHeader>

      <CardContent>
        {records.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Noch kein abgeschlossener Verkauf.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Verkaufte Fahrzeuge erscheinen hier — über die Fahrzeugübergabe
              oder durch Kennzeichnen im Bestand.
            </p>
          </div>
        ) : (
          <>
            {/* Auswertung je Währung — es wird nichts umgerechnet */}
            <div className="mb-6 space-y-2">
              {summen.map((s) => (
                <div
                  key={s.currency}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-md border bg-muted/40 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Rohspanne gesamt ({s.currency})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ohne Aufbereitung, Reparaturen und Standkosten
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-bold tabular-nums ${
                        s.marginCents < 0 ? "text-destructive" : ""
                      }`}
                    >
                      {formatMoney(s.marginCents, s.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      aus {s.counted}{" "}
                      {s.counted === 1 ? "Verkauf" : "Verkäufen"}
                      {s.incomplete > 0 && (
                        <>
                          {" "}
                          · {s.incomplete} ohne vollständige Angaben
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <ul className="divide-y divide-border/60">
              {records.map((r) => {
                const spanne = grossMarginCents(r);
                const tage = soldStandingDays(r);

                return (
                  <li
                    key={r.id}
                    className="grid grid-cols-1 items-center gap-3 py-4 md:grid-cols-[2fr_1.2fr_1fr_1fr_1fr] md:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{vehicleLabel(r)}</p>
                      {r.origin === "transfer" && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Handshake className="h-3 w-3" />
                          per Übergabe
                        </span>
                      )}
                    </div>

                    <div className="text-sm">
                      <span className="text-muted-foreground md:hidden">
                        Verkauft:{" "}
                      </span>
                      <span className="tabular-nums">{formatDate(r.soldOn)}</span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <span className="md:hidden">Standzeit: </span>
                      <span className="tabular-nums">
                        {formatHoldingDays(tage)}
                      </span>
                    </div>

                    <div className="text-sm tabular-nums">
                      <span className="text-muted-foreground md:hidden">
                        Einkauf / Verkauf:{" "}
                      </span>
                      {r.purchasePriceCents != null
                        ? formatMoney(r.purchasePriceCents, r.currency)
                        : "—"}
                      {" → "}
                      {r.salePriceCents != null
                        ? formatMoney(r.salePriceCents, r.currency)
                        : "—"}
                    </div>

                    <div className="text-sm md:text-right">
                      {spanne != null ? (
                        <span
                          className={`font-medium tabular-nums ${
                            spanne < 0 ? "text-destructive" : "text-green-700"
                          }`}
                        >
                          {formatMoney(spanne, r.currency)}
                        </span>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Angaben unvollständig
                        </Badge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
