import Link from "next/link";
import { Info, ArrowRight, Fuel, Wrench, Repeat, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatCentsToEur } from "@/lib/validations/service-entry";
import type { CostOverview } from "@/lib/cost-overview";

interface CostOverviewViewProps {
  vehicleId: string;
  overview: CostOverview;
  /** Beschriftung des Zeitraums, z. B. „Letzte 12 Monate (…)" */
  periodLabel: string;
  /** Der Zeitraum ist wegen junger Datenlage verkürzt */
  shortened: boolean;
  /** Kostenarten, für die nie etwas erfasst wurde */
  untracked: string[];
}

const GRUPPEN_SYMBOLE: Record<string, typeof Fuel> = {
  fuel: Fuel,
  service: Wrench,
  recurring: Repeat,
  oneoff: Receipt,
};

/** Anteil in Prozent, ohne Nachkommastellen — genauer wäre Scheingenauigkeit */
function prozent(anteil: number): string {
  return `${Math.round(anteil * 100)} %`;
}

export function CostOverviewView({
  vehicleId,
  overview,
  periodLabel,
  shortened,
  untracked,
}: CostOverviewViewProps) {
  const basis = `/vehicles/${vehicleId}`;

  if (overview.isEmpty) {
    return (
      <div className="space-y-6">
        <Ueberschrift periodLabel={periodLabel} />
        <Card>
          <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
            <div className="max-w-md space-y-2">
              <p className="font-medium">Noch keine Kosten erfasst</p>
              <p className="text-sm text-muted-foreground">
                Sobald du tankst, eine Werkstattrechnung oder einen laufenden
                Beitrag einträgst, steht hier, was dich das Fahrzeug kostet.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`${basis}/tankbuch`}>Tankvorgang erfassen</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`${basis}/kosten/laufende`}>Laufende Kosten</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`${basis}/kosten/einzelkosten`}>Einzelkosten</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Ueberschrift periodLabel={periodLabel} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kennzahl
          titel="Gesamtkosten"
          wert={formatCentsToEur(overview.totalCents)}
          zusatz="im gewählten Zeitraum"
        />
        <Kennzahl
          titel="Je Monat"
          wert={formatCentsToEur(overview.perMonthCents)}
          zusatz="Durchschnitt"
        />
        {/* Ohne verwertbare Fahrleistung entfällt die Kennzahl mit Begründung —
            ein aus einem einzigen Kilometerstand hochgerechneter Wert sähe
            plausibel aus und wäre falsch. */}
        <Kennzahl
          titel="Je Kilometer"
          wert={
            overview.perKmCents !== null
              ? formatCentsToEur(overview.perKmCents)
              : "—"
          }
          zusatz={
            overview.perKmCents !== null
              ? "auf die Fahrleistung gerechnet"
              : overview.perKmMissingReason === "keine-messpunkte"
                ? "Dafür fehlen zwei Kilometerstände"
                : "Die Kilometerstände widersprechen sich"
          }
        />
        <Kennzahl
          titel="Gefahren"
          wert={
            overview.km !== null
              ? `${overview.km.toLocaleString("de-DE")} km`
              : "—"
          }
          zusatz={overview.km !== null ? "im Zeitraum" : "nicht ermittelbar"}
        />
      </div>

      {shortened && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Der Zeitraum ist kürzer als zwölf Monate, weil davor keine Daten
            erfasst sind. Die Zahlen auf zwölf Monate hochzurechnen wäre eine
            Erfindung — der Monatsdurchschnitt bezieht sich deshalb auf den
            tatsächlich abgedeckten Zeitraum.
          </AlertDescription>
        </Alert>
      )}

      {overview.dominantGroup && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>{overview.dominantGroup.label}</strong> macht{" "}
            {prozent(overview.dominantGroup.share)} der Gesamtkosten aus. Ein
            einzelner großer Posten — etwa eine Restaurierung — verzerrt den
            Monatsdurchschnitt; als Erwartungswert für den nächsten Monat taugt
            er dann nicht.
          </AlertDescription>
        </Alert>
      )}

      {untracked.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Für{" "}
            <strong>
              {untracked.length === 1
                ? untracked[0]
                : `${untracked.slice(0, -1).join(", ")} und ${untracked.at(-1)}`}
            </strong>{" "}
            wurde bisher nichts erfasst. Die Zahlen oben sind deshalb
            eingeschränkt belastbar — sie zeigen, was erfasst ist, nicht
            zwingend, was angefallen ist.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            {overview.singleSource ? "Erfasste Kosten" : "Aufteilung"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {/* Bei nur einer Quelle wird kein Anteil gezeigt: 100 % aus einer
              Quelle ist keine Verteilung, sondern eine Feststellung. */}
          {overview.groups.map((g) => {
            const Symbol = GRUPPEN_SYMBOLE[g.key] ?? Receipt;
            return (
              <Link
                key={g.key}
                href={`${basis}${g.path}`}
                className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/60"
              >
                <Symbol className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">{g.label}</span>
                {!overview.singleSource && (
                  <span className="w-12 shrink-0 text-right text-sm text-muted-foreground tabular-nums">
                    {prozent(g.share)}
                  </span>
                )}
                <span className="w-28 shrink-0 text-right text-sm font-medium tabular-nums">
                  {formatCentsToEur(g.totalCents)}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Der Kaufpreis zählt nicht zu den laufenden Kosten — er steht unter{" "}
        <Link
          href={`${basis}/kosten/wertentwicklung`}
          className="underline underline-offset-2"
        >
          Wertentwicklung
        </Link>
        .
      </p>
    </div>
  );
}

function Ueberschrift({ periodLabel }: { periodLabel: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold">Kosten</h2>
      <p className="text-sm text-muted-foreground">{periodLabel}</p>
    </div>
  );
}

function Kennzahl({
  titel,
  wert,
  zusatz,
}: {
  titel: string;
  wert: string;
  zusatz: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {titel}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{wert}</p>
        <p className="text-sm text-muted-foreground">{zusatz}</p>
      </CardContent>
    </Card>
  );
}
