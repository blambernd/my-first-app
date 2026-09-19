"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Car, Search, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/currency";
import { formatDate, vehicleLabel } from "@/lib/vehicle-format";
import { MarkAsSoldDialog } from "@/components/mark-as-sold-dialog";
import {
  INVENTORY_SORT_LABELS,
  filterInventory,
  formatStandingDays,
  isLongStanding,
  sortInventory,
  standingDays,
  type InventorySort,
  type InventoryVehicle,
} from "@/lib/dealer-inventory";

interface DealerInventoryListProps {
  vehicles: InventoryVehicle[];
  /** Stichtag als ISO-Datum, serverseitig gesetzt */
  today: string;
}

const PAGE_SIZE = 25;

/**
 * Der aktuelle Bestand (PROJ-38).
 *
 * Suche und Sortierung laufen im Browser über die geladene Liste — bei den
 * Größenordnungen eines Händlerbestands ist das sofort und spart eine
 * Serverrunde je Tastendruck.
 *
 * Langsteher werden doppelt gekennzeichnet: durch die Farbe **und** durch
 * den Text daneben. Wer die Seite in Graustufen liest oder Farben schlecht
 * unterscheidet, verliert die Information sonst vollständig.
 */
export function DealerInventoryList({
  vehicles,
  today,
}: DealerInventoryListProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<InventorySort>("standing");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [soldTarget, setSoldTarget] = useState<InventoryVehicle | null>(null);

  const reference = useMemo(() => new Date(`${today}T00:00:00Z`), [today]);

  const shown = useMemo(
    () => sortInventory(filterInventory(vehicles, query), sort),
    [vehicles, query, sort]
  );

  const page = shown.slice(0, visible);

  return (
    <>
      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-lg">Im Bestand</CardTitle>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisible(PAGE_SIZE);
                }}
                placeholder="Marke, Modell oder Kennzeichen"
                className="pl-9"
                aria-label="Bestand durchsuchen"
              />
            </div>

            <Select
              value={sort}
              onValueChange={(v) => setSort(v as InventorySort)}
            >
              <SelectTrigger className="sm:w-56" aria-label="Sortierung">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(INVENTORY_SORT_LABELS) as InventorySort[]).map(
                  (mode) => (
                    <SelectItem key={mode} value={mode}>
                      {INVENTORY_SORT_LABELS[mode]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {vehicles.length === 0 ? (
            <div className="py-10 text-center">
              <Car className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Noch kein Fahrzeug im Bestand.
              </p>
            </div>
          ) : shown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Kein Fahrzeug passt zu „{query.trim()}&ldquo;.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-border/60">
                {page.map((v) => {
                  const tage = standingDays(v.purchasedOn, reference);
                  const langsteher = isLongStanding(tage);

                  return (
                    <li
                      key={v.id}
                      className="relative grid grid-cols-1 items-center gap-3 py-4 transition-colors hover:bg-muted/50 md:grid-cols-[2fr_1.2fr_1.4fr_1fr_auto] md:gap-4"
                    >
                      {/* Fahrzeug — die unsichtbare Fläche macht die ganze
                          Zeile klickbar, ohne verschachtelte Links */}
                      <div className="min-w-0">
                        <Link
                          href={`/vehicles/${v.id}`}
                          className="font-medium hover:underline after:absolute after:inset-0 after:content-['']"
                        >
                          {vehicleLabel(v)}
                        </Link>
                        {v.licensePlate && (
                          <p className="text-sm text-muted-foreground">
                            {v.licensePlate}
                          </p>
                        )}
                      </div>

                      {/* Kaufdatum */}
                      <div className="text-sm">
                        <span className="text-muted-foreground md:hidden">
                          Zugang:{" "}
                        </span>
                        <span className="tabular-nums">
                          {formatDate(v.purchasedOn)}
                        </span>
                        {v.purchaseDateEstimated && v.purchasedOn && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (geschätzt)
                          </span>
                        )}
                      </div>

                      {/* Standzeit */}
                      <div className="text-sm">
                        <span
                          className={
                            langsteher
                              ? "font-medium text-destructive"
                              : "text-muted-foreground"
                          }
                        >
                          {formatStandingDays(tage)}
                        </span>
                        {langsteher && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Langsteher
                          </Badge>
                        )}
                      </div>

                      {/* Einkauf */}
                      <div className="text-sm tabular-nums">
                        <span className="text-muted-foreground md:hidden">
                          Einkauf:{" "}
                        </span>
                        {v.purchasePriceCents != null
                          ? formatMoney(v.purchasePriceCents, v.currency)
                          : "—"}
                      </div>

                      {/* Aktion — liegt über der Zeilenfläche */}
                      <div className="relative z-10 md:justify-self-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSoldTarget(v)}
                        >
                          <Tag className="mr-1 h-4 w-4" />
                          Als verkauft kennzeichnen
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {shown.length > page.length && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Badge variant="secondary">
                    {page.length} von {shown.length}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVisible((n) => n + PAGE_SIZE)}
                  >
                    Weitere anzeigen
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <MarkAsSoldDialog
        vehicle={soldTarget}
        open={soldTarget !== null}
        onOpenChange={(open) => !open && setSoldTarget(null)}
      />
    </>
  );
}
