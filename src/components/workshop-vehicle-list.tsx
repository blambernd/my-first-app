"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
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
import {
  SORT_LABELS,
  filterVehicles,
  formatDate,
  formatDueDistance,
  formatMileage,
  isOverdue,
  sortVehicles,
  vehicleLabel,
  type SortMode,
  type WorkshopVehicle,
} from "@/lib/workshop-dashboard";

interface WorkshopVehicleListProps {
  vehicles: WorkshopVehicle[];
  /** Stichtag als ISO-Datum, serverseitig gesetzt (PROJ-37) */
  today: string;
}

/** Wie viele Zeilen zunächst erscheinen und wie viele je Klick nachrücken. */
const PAGE_SIZE = 25;

/**
 * Liste der betreuten Kundenfahrzeuge (PROJ-37).
 *
 * Suche und Sortierung laufen im Browser über die bereits geladene Liste:
 * Bei den Größenordnungen, um die es hier geht, ist das sofort — und spart
 * eine Serverrunde je Tastendruck.
 *
 * Geld steht hier ausschließlich für Einträge, die dieser Werkstatt-Nutzer
 * selbst angelegt hat. Die Auswahl trifft die Seite serverseitig; diese
 * Komponente bekommt fremde Beträge gar nicht erst zu sehen.
 */
export function WorkshopVehicleList({ vehicles, today }: WorkshopVehicleListProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("due");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const reference = useMemo(() => new Date(`${today}T00:00:00Z`), [today]);

  const shown = useMemo(
    () => sortVehicles(filterVehicles(vehicles, query), sort),
    [vehicles, query, sort]
  );

  const page = shown.slice(0, visible);

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle className="text-lg">Kundenfahrzeuge</CardTitle>

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
              aria-label="Kundenfahrzeuge durchsuchen"
            />
          </div>

          <Select
            value={sort}
            onValueChange={(value) => setSort(value as SortMode)}
          >
            <SelectTrigger className="sm:w-56" aria-label="Sortierung">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {SORT_LABELS[mode]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {shown.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Kein Fahrzeug passt zu „{query.trim()}&ldquo;.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border/60">
              {page.map((v) => {
                const overdue = v.nextDue
                  ? isOverdue(v.nextDue.dueDate, reference)
                  : false;

                return (
                  <li
                    key={v.id}
                    // QA BUG-6: Die ganze Zeile führt zum Fahrzeug, nicht nur
                    // der Name. Umgesetzt über eine unsichtbare Fläche am
                    // Fahrzeug-Link (`after:absolute after:inset-0`) statt
                    // über einen Link um die Zeile — Letzteres wäre ungültig,
                    // weil die Schnellaktion selbst ein Link ist.
                    className="relative grid grid-cols-1 items-center gap-3 py-4 transition-colors hover:bg-muted/50 md:grid-cols-[2fr_1fr_1fr_1.4fr_auto] md:gap-4"
                  >
                    {/* Fahrzeug */}
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

                    {/* Kilometerstand */}
                    <div className="text-sm">
                      <span className="text-muted-foreground md:hidden">
                        Kilometerstand:{" "}
                      </span>
                      <span className="tabular-nums">
                        {formatMileage(v.lastMileageKm)}
                      </span>
                    </div>

                    {/* Letzter Eintrag */}
                    <div className="text-sm">
                      <span className="text-muted-foreground md:hidden">
                        Letzter Eintrag:{" "}
                      </span>
                      <span className="tabular-nums">
                        {formatDate(v.lastEntryDate)}
                      </span>
                    </div>

                    {/* Nächste Fälligkeit */}
                    <div className="text-sm">
                      {v.nextDue ? (
                        <div className="flex flex-wrap items-center gap-x-2">
                          <span>{v.nextDue.label}</span>
                          <span
                            className={
                              overdue
                                ? "font-medium text-destructive"
                                : "text-muted-foreground"
                            }
                          >
                            {formatDueDistance(v.nextDue.dueDate, reference)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Kein Termin hinterlegt
                        </span>
                      )}

                      {v.ownEntryCount > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {v.ownEntryCount === 1
                            ? "1 eigener Eintrag"
                            : `${v.ownEntryCount} eigene Einträge`}
                          {v.ownCostCents != null && (
                            <> · {formatMoney(v.ownCostCents, v.currency)}</>
                          )}
                        </p>
                      )}
                    </div>

                    {/* Schnellaktion — liegt über der Zeilenfläche (QA BUG-6) */}
                    <div className="relative z-10 md:justify-self-end">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/vehicles/${v.id}/scheckheft?neu=1&from=werkstatt`}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Eintrag anlegen
                        </Link>
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
  );
}
