"use client";

import Link from "next/link";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { Info, TrendingUp, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatCentsToEur } from "@/lib/validations/service-entry";
import {
  STALE_ANALYSIS_DAYS,
  type ValueDevelopment,
} from "@/lib/value-development";

interface ValueDevelopmentViewProps {
  vehicleId: string;
  result: ValueDevelopment | null;
  /** Kosten liegen vor dem Kaufdatum — deutet auf einen Tippfehler hin */
  costsBefore: { affected: boolean; earliestMonth: string | null };
}

/** Vorzeichenbehaftete Darstellung; bewusst ohne Warnfarbe bei Verlust */
function formatSigned(cents: number): string {
  const formatted = formatCentsToEur(Math.abs(cents));
  if (cents > 0) return `+ ${formatted}`;
  if (cents < 0) return `− ${formatted}`;
  return formatted;
}

function monthLabel(month: string): string {
  return format(parse(`${month}-01`, "yyyy-MM-dd", new Date()), "MMMM yyyy", {
    locale: de,
  });
}

export function ValueDevelopmentView({
  vehicleId,
  result,
  costsBefore,
}: ValueDevelopmentViewProps) {
  if (!result) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium">Noch kein Kaufpreis hinterlegt</p>
            <p className="text-sm text-muted-foreground">
              Die Wertentwicklung vergleicht Anschaffung, Unterhalt und
              geschätzten Marktwert. Dafür wird der Kaufpreis gebraucht — ohne
              ihn wäre jede Bilanz irreführend.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/vehicles/${vehicleId}`}>
              Anschaffung im Fahrzeugprofil erfassen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { market } = result;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Wertentwicklung</h2>

      {/* Was das Fahrzeug gekostet hat — immer verfügbar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Anschaffung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCentsToEur(result.acquisitionCents)}
            </p>
            <p className="text-sm text-muted-foreground">
              {result.extraCents > 0
                ? `Kaufpreis ${formatCentsToEur(
                    result.purchaseCents
                  )} + Nebenkosten ${formatCentsToEur(result.extraCents)}`
                : "Kaufpreis ohne Nebenkosten"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Investition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCentsToEur(result.upkeepCents)}
            </p>
            <p className="text-sm text-muted-foreground">
              Aufgelaufene Unterhaltskosten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bisher aufgewendet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCentsToEur(result.totalSpentCents)}
            </p>
            <p className="text-sm text-muted-foreground">
              Anschaffung und Investition zusammen
            </p>
          </CardContent>
        </Card>
      </div>

      {costsBefore.affected && costsBefore.earliestMonth && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Es sind Kosten aus der Zeit <strong>vor dem Kaufdatum</strong>{" "}
            erfasst — die früheste stammt aus {monthLabel(costsBefore.earliestMonth)}.
            Das kann ein Tippfehler im Kaufdatum sein oder Aufwand aus der Zeit
            vor dem Kauf. Beides zählt derzeit zur Investition.
          </AlertDescription>
        </Alert>
      )}

      {market ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Geschätzter Marktwert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCentsToEur(market.cents)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {market.basis === "median" ? "Median" : "Durchschnitt"} der
                  Vergleichsangebote
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Wertveränderung
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Bewusst ohne Warnfarbe: Ein Marktwert unter dem Kaufpreis
                    ist gerade in den ersten Jahren der Normalfall */}
                <p className="text-2xl font-bold">
                  {formatSigned(result.valueChangeCents ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  gegenüber dem Kaufpreis von{" "}
                  {formatCentsToEur(result.purchaseCents)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gesamtbilanz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatSigned(result.balanceCents ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Marktwert abzüglich allem, was bisher aufgewendet wurde
                </p>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="space-y-1">
              <p>
                Der Marktwert ist eine <strong>Schätzung</strong> aus
                Vergleichsangeboten, kein erzielter Verkaufserlös. Was ein
                Fahrzeug tatsächlich bringt, hängt von Zustand, Papieren und
                Käufer ab.
              </p>
              <p className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                Zugrunde liegende Analyse vom{" "}
                {format(new Date(market.analysedOn), "dd.MM.yyyy", {
                  locale: de,
                })}
                {market.ageInDays > STALE_ANALYSIS_DAYS && (
                  <>
                    {" "}
                    — das ist über {STALE_ANALYSIS_DAYS} Tage her, eine neue
                    Analyse wäre aussagekräftiger.
                  </>
                )}
              </p>
            </AlertDescription>
          </Alert>
        </>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Für den Vergleich mit dem Marktwert wird eine Marktpreis-Analyse
              gebraucht. Die Kostenseite oben gilt auch ohne sie.
            </span>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href={`/vehicles/${vehicleId}/marktpreis`}>
                Marktpreis ermitteln
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
