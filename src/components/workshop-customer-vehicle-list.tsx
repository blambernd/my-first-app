"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, formatMileage, vehicleLabel } from "@/lib/vehicle-format";
import {
  customerLabel,
  filterCustomerVehicles,
  type CustomerVehicle,
} from "@/lib/workshop-customers";

interface WorkshopCustomerVehicleListProps {
  vehicles: CustomerVehicle[];
}

/** Wie viele Zeilen zunächst erscheinen und wie viele je Klick nachrücken. */
const PAGE_SIZE = 25;

/**
 * Die selbst angelegten Kundenfahrzeuge einer Werkstatt (PROJ-39).
 *
 * Getrennt von der Liste der betreuten Fahrzeuge, weil sich die Rechte
 * unterscheiden: Hier ist die Werkstatt Besitzer und darf alles, dort ist
 * sie Gast und darf Einträge und Dokumente hinzufügen — mehr nicht. Eine
 * gemeinsame Liste müsste diesen Unterschied je Zeile erklären.
 */
export function WorkshopCustomerVehicleList({
  vehicles,
}: WorkshopCustomerVehicleListProps) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const gefiltert = useMemo(
    () => filterCustomerVehicles(vehicles, query),
    [vehicles, query]
  );
  const sichtbar = gefiltert.slice(0, visible);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">
          Meine Kundenfahrzeuge
          {vehicles.length > 0 && (
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              {vehicles.length}
            </span>
          )}
        </CardTitle>

        <Button asChild size="sm">
          <Link href="/vehicles/new">
            <Plus className="mr-1 h-4 w-4" />
            Kundenfahrzeug anlegen
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {vehicles.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            Du hast noch kein Kundenfahrzeug angelegt. Lege eines an, um die
            Wartung zu dokumentieren — auch wenn dein Kunde noch kein Konto
            hat. Übergeben kannst du es ihm später.
          </p>
        ) : (
          <>
            {vehicles.length > 5 && (
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setVisible(PAGE_SIZE);
                  }}
                  placeholder="Marke, Modell, Kennzeichen oder Kunde"
                  className="pl-9"
                  aria-label="Kundenfahrzeuge durchsuchen"
                />
              </div>
            )}

            {gefiltert.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Kein Fahrzeug passt zu &bdquo;{query}&ldquo;.
              </p>
            ) : (
              <ul className="divide-y">
                {sichtbar.map((v) => {
                  const kunde = customerLabel(v.customer);

                  return (
                    <li key={v.id}>
                      <Link
                        href={`/vehicles/${v.id}`}
                        className="hover:bg-accent -mx-2 flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-3 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {vehicleLabel({
                              make: v.make,
                              model: v.model,
                              year: v.year,
                            })}
                          </p>

                          <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                            {v.licensePlate && <span>{v.licensePlate}</span>}
                            <span>{formatMileage(v.mileageKm)}</span>
                            {kunde && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {kunde}
                              </span>
                            )}
                          </p>
                        </div>

                        <span className="text-muted-foreground text-sm">
                          angelegt {formatDate(v.createdAt.slice(0, 10))}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {gefiltert.length > visible && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setVisible((n) => n + PAGE_SIZE)}
              >
                Weitere {Math.min(PAGE_SIZE, gefiltert.length - visible)} anzeigen
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
