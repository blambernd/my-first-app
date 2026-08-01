"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Info, ChartColumn, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { type ChartConfig } from "@/components/ui/chart";
import { formatCentsToEur } from "@/lib/validations/service-entry";
import {
  SOURCE_META,
  type CostAnalysis,
  type CategoryResult,
} from "@/lib/cost-analysis";

/** Zehn Farben stehen bereit; darüber hinaus wird zyklisch wiederverwendet */
const CHART_COLORS = Array.from(
  { length: 10 },
  (_, i) => `hsl(var(--chart-${i + 1}))`
);

// Diagramme erst im Browser laden: Recharts misst den Container aus, wozu es
// serverseitig keine Maße gibt — das erzeugte SVG unterschiede sich sonst
// zwangsläufig zwischen Server und Browser und bräche die Hydration.
const ChartPlaceholder = () => <Skeleton className="h-[260px] w-full" />;

const CostDistributionChart = dynamic(
  () => import("@/components/cost-charts").then((m) => m.CostDistributionChart),
  { ssr: false, loading: ChartPlaceholder }
);

const CostTimelineChart = dynamic(
  () => import("@/components/cost-charts").then((m) => m.CostTimelineChart),
  { ssr: false, loading: ChartPlaceholder }
);

type ClassificationFilter = "all" | "standing" | "driving";

interface CostAnalysisViewProps {
  vehicleId: string;
  /** Eine fertige Auswertung je wählbarem Zeitraum, auf dem Server gerechnet */
  results: CostAnalysis[];
  /** Es wurden mehr Datensätze gefunden als geladen */
  truncated: boolean;
}

export function CostAnalysisView({
  vehicleId,
  results,
  truncated,
}: CostAnalysisViewProps) {
  const [periodIndex, setPeriodIndex] = useState(0);
  const [filter, setFilter] = useState<ClassificationFilter>("all");

  const analysis = results[periodIndex] ?? results[0];

  // Farbe an den Schlüssel binden, nicht an die Position im Diagramm — sonst
  // wechselt eine Kostenart die Farbe, sobald der Filter eine andere ausblendet
  const colorByKey = useMemo(() => {
    const map = new Map<string, string>();
    analysis.categories.forEach((category, index) => {
      map.set(category.key, CHART_COLORS[index % CHART_COLORS.length]);
    });
    return map;
  }, [analysis.categories]);

  const matchesFilter = (category: CategoryResult) =>
    filter === "all" || category.classification === filter;

  /** Kostenarten mit Betrag im Zeitraum, für die Diagramme */
  const visible = useMemo(
    () =>
      analysis.categories.filter((c) => matchesFilter(c) && c.totalCents > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analysis.categories, filter]
  );

  /** Alle erfassten Kostenarten, auch mit 0 € — für die Tabelle */
  const tableRows = useMemo(
    () => analysis.categories.filter((c) => matchesFilter(c) && c.tracked),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analysis.categories, filter]
  );

  const visibleTotal = visible.reduce((sum, c) => sum + c.totalCents, 0);

  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    for (const category of analysis.categories) {
      config[category.key] = {
        label: category.label,
        color: colorByKey.get(category.key),
      };
    }
    return config;
  }, [analysis.categories, colorByKey]);

  const pieData = visible.map((c) => ({
    key: c.key,
    label: c.label,
    value: c.totalCents,
  }));

  // Nur Monate mit Daten zeigen — eine durchgezogene Nulllinie neben
  // befüllten Monaten behauptet eine Aussage, die die Daten nicht hergeben
  const monthData = useMemo(() => {
    const keys = visible.map((c) => c.key);
    return analysis.months
      .map((month) => {
        const row: Record<string, string | number> = { label: month.label };
        let sum = 0;
        for (const key of keys) {
          const cents = month.byCategory[key] ?? 0;
          row[key] = cents / 100;
          sum += cents;
        }
        return { row, sum };
      })
      .filter((entry) => entry.sum > 0)
      .map((entry) => entry.row);
  }, [analysis.months, visible]);

  if (!analysis.hasAnyData) {
    return <EmptyState vehicleId={vehicleId} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Auswertung</h2>
        <Select
          value={String(periodIndex)}
          onValueChange={(value) => setPeriodIndex(Number(value))}
        >
          <SelectTrigger className="sm:w-56" aria-label="Zeitraum wählen">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {results.map((result, index) => (
              <SelectItem key={result.period.label} value={String(index)}>
                {result.period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kennzahlen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtkosten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCentsToEur(analysis.totalCents)}
            </p>
            <p className="text-sm text-muted-foreground">
              {analysis.period.label}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Standkosten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {analysis.standingPerMonthCents !== null
                ? `${formatCentsToEur(analysis.standingPerMonthCents)} / Monat`
                : "—"}
            </p>
            <p className="text-sm text-muted-foreground">
              {analysis.standingPerYearCents !== null
                ? `${formatCentsToEur(
                    analysis.standingPerYearCents
                  )} im Jahr — auch ohne zu fahren`
                : "Noch keine Standkosten erfasst"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kosten pro Kilometer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {analysis.centsPerKm !== null
                ? `${formatCentsToEur(Math.round(analysis.centsPerKm))} / km`
                : "nicht berechenbar"}
            </p>
            <p className="text-sm text-muted-foreground">
              {analysis.mileage.km !== null
                ? `Grundlage: ${analysis.mileage.km.toLocaleString(
                    "de-DE"
                  )} km im Zeitraum`
                : "Dafür werden mindestens zwei Kilometerstände gebraucht"}
            </p>
          </CardContent>
        </Card>
      </div>

      <DataQualityNotes analysis={analysis} truncated={truncated} />

      {/* Aufteilung Stand- und Fahrtkosten */}
      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as ClassificationFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">Alle Kostenarten</TabsTrigger>
          <TabsTrigger value="standing">Standkosten</TabsTrigger>
          <TabsTrigger value="driving">Fahrtkosten</TabsTrigger>
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Für diese Auswahl liegen im Zeitraum keine Kosten vor.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Verteilung nach Kostenart
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CostDistributionChart data={pieData} config={chartConfig} />

                {/* Beschriftete Legende: Die Kostenarten dürfen nicht allein
                    über die Farbe erkennbar sein */}
                <ul className="mt-4 space-y-1">
                  {visible.map((category) => (
                    <li
                      key={category.key}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ background: colorByKey.get(category.key) }}
                        />
                        <span className="truncate">{category.label}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {visibleTotal > 0
                          ? `${Math.round(
                              (category.totalCents / visibleTotal) * 100
                            )} %`
                          : "0 %"}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Entwicklung über die Zeit
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthData.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Für diesen Zeitraum gibt es keine Monate mit Kosten.
                  </p>
                ) : (
                  <CostTimelineChart
                    data={monthData}
                    series={visible.map((c) => ({ key: c.key, label: c.label }))}
                    config={chartConfig}
                  />
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Monate ohne Kosten werden ausgelassen. Laufende Kosten
                  erscheinen monatlich umgelegt, nicht als Spitze im
                  Zahlungsmonat.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabelle mit Verweis zur Quelle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kostenarten im Detail</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kostenart</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                    <TableHead className="text-right">Anteil</TableHead>
                    <TableHead className="text-right">Positionen</TableHead>
                    <TableHead>Quelle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((category) => (
                    <TableRow key={category.key}>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className="h-3 w-3 shrink-0 rounded-sm"
                            style={{ background: colorByKey.get(category.key) }}
                          />
                          {category.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCentsToEur(category.totalCents)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {visibleTotal > 0
                          ? `${Math.round(
                              (category.totalCents / visibleTotal) * 100
                            )} %`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {category.entryCount}
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-wrap gap-2">
                          {category.sources.map((source) => (
                            <Link
                              key={source}
                              href={`/vehicles/${vehicleId}${SOURCE_META[source].path}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {SOURCE_META[source].label}
                            </Link>
                          ))}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filter === "all" && analysis.unclassifiedCents > 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {formatCentsToEur(analysis.unclassifiedCents)} entfallen auf
                  Kostenarten ohne Einordnung als Stand- oder Fahrtkosten. Sie
                  zählen zur Gesamtsumme, tauchen aber in keiner der beiden
                  Aufteilungen auf.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function DataQualityNotes({
  analysis,
  truncated,
}: {
  analysis: CostAnalysis;
  truncated: boolean;
}) {
  const { quality } = analysis;
  const notes: string[] = [];

  if (quality.excludedCount > 0) {
    notes.push(
      `${quality.excludedCount} ${
        quality.excludedCount === 1 ? "Betrag ist" : "Beträge sind"
      } als im Scheckheft enthalten markiert und ${
        quality.excludedCount === 1 ? "wurde" : "wurden"
      } nicht zusätzlich gezählt (${formatCentsToEur(quality.excludedCents)}).`
    );
  }
  if (quality.serviceEntriesWithoutCost > 0) {
    notes.push(
      `${quality.serviceEntriesWithoutCost} ${
        quality.serviceEntriesWithoutCost === 1
          ? "Scheckheft-Eintrag hat"
          : "Scheckheft-Einträge haben"
      } keine Kostenangabe und ${
        quality.serviceEntriesWithoutCost === 1 ? "fehlt" : "fehlen"
      } deshalb in der Summe.`
    );
  }
  if (quality.overlappingRecurring > 0) {
    notes.push(
      `${quality.overlappingRecurring} laufende Kosten haben überlappende Zeiträume derselben Kostenart — die Beträge könnten doppelt enthalten sein.`
    );
  }
  if (truncated) {
    notes.push(
      "Es sind mehr Einträge vorhanden, als geladen wurden. Die Auswertung deckt deshalb nur einen Teil ab."
    );
  }

  const hasUntracked = quality.untracked.length > 0;
  if (!hasUntracked && notes.length === 0) return null;

  return (
    <Alert variant={truncated ? "destructive" : "default"}>
      <Info className="h-4 w-4" />
      <AlertDescription className="space-y-2">
        {hasUntracked && (
          <div>
            <p>
              Diese Kostenarten sind noch <strong>nicht erfasst</strong> und
              fehlen in der Auswertung — sie sind nicht 0 €, sondern unbekannt:
            </p>
            {/* div statt p: Badge rendert selbst ein div, das in einem
                Absatz ungültiges HTML wäre und die Hydration bricht */}
            <div className="mt-1 flex flex-wrap gap-1">
              {quality.untracked.map((label) => (
                <Badge key={label} variant="outline">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </AlertDescription>
    </Alert>
  );
}

function EmptyState({ vehicleId }: { vehicleId: string }) {
  const sources = [
    { path: "/tankbuch", label: "Tankbuch", hint: "Benzinkosten" },
    { path: "/scheckheft", label: "Scheckheft", hint: "Wartung und Reparatur" },
    { path: "/kosten", label: "Laufende Kosten", hint: "Versicherung, Steuer, Garage" },
    {
      path: "/kosten/einzelkosten",
      label: "Einzelkosten",
      hint: "Ersatzteile und Gutachten",
    },
  ];

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
        <ChartColumn className="h-12 w-12 text-muted-foreground/40" />
        <div>
          <p className="font-medium">Noch keine Kosten zum Auswerten</p>
          <p className="text-sm text-muted-foreground">
            Die Auswertung führt zusammen, was an vier Stellen erfasst wird. Sie
            erscheint, sobald dort Daten vorliegen.
          </p>
        </div>
        <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
          {sources.map((source) => (
            <Button
              key={source.path}
              variant="outline"
              asChild
              className="justify-between"
            >
              <Link href={`/vehicles/${vehicleId}${source.path}`}>
                <span className="flex flex-col items-start">
                  <span>{source.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {source.hint}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
