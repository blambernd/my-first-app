"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { Fuel, Plus, Pencil, Trash2, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
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
import { FuelEntryForm } from "@/components/fuel-entry-form";
import { formatCentsToEur } from "@/lib/validations/service-entry";
import {
  calculateConsumption,
  calculateStats,
  buildConsumptionSeries,
  sortChronologically,
} from "@/lib/fuel-consumption";
import {
  formatConsumption,
  formatKm,
  formatLiters,
  getFuelTypeLabel,
  type FuelEntry,
} from "@/lib/validations/fuel-entry";

interface FuelLogProps {
  vehicleId: string;
  initialEntries: FuelEntry[];
  vehicleMileageKm: number | null;
  canEdit: boolean;
  canDelete: boolean;
}

// Eine Serie: die Überschrift benennt sie, deshalb keine Legende.
const chartConfig = {
  consumption: {
    label: "Verbrauch",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function FuelLog({
  vehicleId,
  initialEntries,
  vehicleMileageKm,
  canEdit,
  canDelete,
}: FuelLogProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FuelEntry | undefined>();
  const [pendingDelete, setPendingDelete] = useState<FuelEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  const { rowsNewestFirst, stats, series, latestMileageKm } = useMemo(() => {
    const sorted = sortChronologically(initialEntries);
    const computed = calculateConsumption(sorted);
    return {
      rowsNewestFirst: [...computed].reverse(),
      stats: calculateStats(computed),
      series: buildConsumptionSeries(computed),
      latestMileageKm: sorted.length
        ? sorted[sorted.length - 1].mileage_km
        : null,
    };
  }, [initialEntries]);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(entry: FuelEntry) {
    setEditing(entry);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("fuel_entries")
        .delete()
        .eq("id", pendingDelete.id);
      if (error) throw error;
      toast.success("Tankvorgang gelöscht");
      setPendingDelete(null);
      router.refresh();
    } catch (error) {
      console.error("Tankvorgang konnte nicht gelöscht werden:", error);
      toast.error("Löschen fehlgeschlagen");
    } finally {
      setDeleting(false);
    }
  }

  if (initialEntries.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Fuel className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium">Noch keine Tankvorgänge erfasst</p>
              <p className="text-sm text-muted-foreground">
                Erfasse deinen ersten Tankstopp — nach der zweiten Volltankung
                siehst du hier auch den Verbrauch.
              </p>
            </div>
            {canEdit && (
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Tankvorgang erfassen
              </Button>
            )}
          </CardContent>
        </Card>

        <FuelEntryForm
          vehicleId={vehicleId}
          open={formOpen}
          onOpenChange={setFormOpen}
          onSaved={() => router.refresh()}
          vehicleMileageKm={vehicleMileageKm}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Tankbuch</h2>
        {canEdit && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Tankvorgang</span> erfassen
          </Button>
        )}
      </div>

      {/* Kennzahlen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Durchschnittsverbrauch
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.averageConsumption !== null ? (
              <p className="text-2xl font-bold">
                {formatConsumption(stats.averageConsumption)}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  L/100km
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Verfügbar ab der zweiten Volltankung
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Spritkosten gesamt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCentsToEur(stats.totalCostCents)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatLiters(stats.totalLiters)} L in {stats.entryCount}{" "}
              {stats.entryCount === 1 ? "Tankvorgang" : "Tankvorgängen"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ø Preis pro Liter
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.averagePricePerLiterCents !== null ? (
              <p className="text-2xl font-bold">
                {formatCentsToEur(stats.averagePricePerLiterCents)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Keine Angabe</p>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.implausibleCount > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {stats.implausibleCount === 1
              ? "Ein Abschnitt hat einen unplausiblen Verbrauchswert und bleibt im Durchschnitt unberücksichtigt."
              : `${stats.implausibleCount} Abschnitte haben unplausible Verbrauchswerte und bleiben im Durchschnitt unberücksichtigt.`}{" "}
            Prüfe die markierten Einträge auf Tippfehler beim Kilometerstand.
          </AlertDescription>
        </Alert>
      )}

      {/* Verbrauchsverlauf */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Verbrauchsentwicklung in L/100km
          </CardTitle>
        </CardHeader>
        <CardContent>
          {series.length >= 2 ? (
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <LineChart
                data={series}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                  tickFormatter={(value: string) =>
                    format(parse(value, "yyyy-MM-dd", new Date()), "MMM yy", {
                      locale: de,
                    })
                  }
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={32}
                  domain={["dataMin - 1", "dataMax + 1"]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value: string) =>
                        format(
                          parse(value, "yyyy-MM-dd", new Date()),
                          "dd.MM.yyyy",
                          { locale: de }
                        )
                      }
                      formatter={(value) => [
                        `${formatConsumption(Number(value))} L/100km`,
                        "",
                      ]}
                    />
                  }
                />
                <Line
                  dataKey="consumption"
                  type="monotone"
                  stroke="var(--color-consumption)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Der Verlauf erscheint, sobald mindestens zwei auswertbare Abschnitte
              vorliegen — dafür brauchst du drei Volltankungen.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Liste */}
      <div className="space-y-3">
        {rowsNewestFirst.map((row) => {
          const { entry } = row;
          return (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {format(
                          parse(entry.fueled_at, "yyyy-MM-dd", new Date()),
                          "dd.MM.yyyy",
                          { locale: de }
                        )}
                      </span>
                      {!entry.is_full_tank && (
                        <Badge variant="secondary">Teilbetankung</Badge>
                      )}
                      {entry.is_odometer_correction && (
                        <Badge variant="secondary">Tacho-Korrektur</Badge>
                      )}
                      {entry.fuel_type && (
                        <Badge variant="outline">
                          {getFuelTypeLabel(entry.fuel_type)}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {formatLiters(entry.liters)} L ·{" "}
                      {/* Ohne Betrag (Besitzerwechsel, PROJ-32) ein Strich —
                          „0,00 €" hieße, der Tankvorgang sei gratis gewesen. */}
                      {entry.cost_cents === null
                        ? "—"
                        : formatCentsToEur(entry.cost_cents)}
                      {row.pricePerLiterCents !== null && (
                        <> · {formatCentsToEur(row.pricePerLiterCents)}/L</>
                      )}{" "}
                      · {formatKm(entry.mileage_km)} km
                    </p>

                    {entry.station && (
                      <p className="text-sm text-muted-foreground">
                        {entry.station}
                      </p>
                    )}
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground">
                        {entry.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {row.consumption !== null ? (
                        <>
                          <p
                            className={`text-lg font-semibold ${
                              row.isImplausible ? "text-muted-foreground" : ""
                            }`}
                          >
                            {formatConsumption(row.consumption)}
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              L/100km
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatKm(row.fromMileageKm!)} –{" "}
                            {formatKm(entry.mileage_km)} km
                          </p>
                          {row.isImplausible && (
                            <p className="flex items-center justify-end gap-1 text-xs text-amber-600 dark:text-amber-500">
                              <AlertTriangle className="h-3 w-3" />
                              unplausibel
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          kein Verbrauch berechenbar
                        </p>
                      )}
                    </div>

                    {(canEdit || canDelete) && (
                      <div className="flex gap-1">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(entry)}
                            aria-label="Tankvorgang bearbeiten"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPendingDelete(entry)}
                            aria-label="Tankvorgang löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <FuelEntryForm
        vehicleId={vehicleId}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => router.refresh()}
        entry={editing}
        previousMileageKm={editing ? null : latestMileageKm}
        vehicleMileageKm={vehicleMileageKm}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tankvorgang löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Eintrag wird dauerhaft entfernt. Die Verbrauchswerte der
              angrenzenden Abschnitte werden neu berechnet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
