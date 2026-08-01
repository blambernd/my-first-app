"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCentsToEur } from "@/lib/validations/service-entry";

/**
 * Die beiden Diagramme der Kostenanalyse, bewusst in einer eigenen Datei.
 *
 * Recharts misst den Container aus, bevor es zeichnet — serverseitig gibt es
 * keine Maße, weshalb das erzeugte SVG auf dem Server zwangsläufig andere
 * Attribute trägt als im Browser. Das äußert sich als Hydration-Warnung.
 * Deshalb wird diese Datei von der Ansicht ausschließlich im Browser
 * nachgeladen (`next/dynamic` mit `ssr: false`).
 *
 * Zur Farbgebung: Die Farbe **muss** über `var(--color-<schlüssel>)` gesetzt
 * werden. `ChartContainer` legt diese Variablen aus der Konfiguration an. Ein
 * verschachteltes `hsl(var(--chart-1))` direkt als SVG-Attribut löst der
 * Browser dagegen nicht auf — die Flächen blieben unsichtbar, während Achsen
 * und Tooltip weiterhin korrekt aussehen. Der Fehler fällt deshalb erst in der
 * Sichtprüfung auf, nicht beim Übersetzen.
 */

export interface ChartSeries {
  key: string;
  label: string;
}

function seriesColor(key: string): string {
  return `var(--color-${key})`;
}

interface DistributionProps {
  data: Array<{ key: string; label: string; value: number }>;
  config: ChartConfig;
}

export function CostDistributionChart({ data, config }: DistributionProps) {
  return (
    <ChartContainer config={config} className="mx-auto h-[240px] w-full">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name) => (
                <span>
                  {(config[name as string]?.label as string) ?? name}:{" "}
                  {formatCentsToEur(Number(value))}
                </span>
              )}
            />
          }
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="key"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={1}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={seriesColor(entry.key)} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

interface TimelineProps {
  /** Beträge je Monat in Euro, Schlüssel sind die Kostenarten */
  data: Array<Record<string, string | number>>;
  series: ChartSeries[];
  config: ChartConfig;
}

export function CostTimelineChart({ data, series, config }: TimelineProps) {
  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(value: number) => `${value} €`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span>
                  {(config[name as string]?.label as string) ?? name}:{" "}
                  {formatCentsToEur(Math.round(Number(value) * 100))}
                </span>
              )}
            />
          }
        />
        {series.map((entry) => (
          <Bar
            key={entry.key}
            dataKey={entry.key}
            stackId="kosten"
            fill={seriesColor(entry.key)}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
