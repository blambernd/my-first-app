"use client";

import { useCurrency } from "@/components/currency-provider";
import { EXTERNAL_CURRENCY, getCurrencyName } from "@/lib/currency";

/**
 * Hinweis an Preisangaben, die **nicht** in Fahrzeugwährung stehen (PROJ-36).
 *
 * Die Ersatzteil-Angebote (PROJ-9) und die Marktpreis-Analyse (PROJ-11)
 * stammen aus dem deutschen Markt und sind dort in Euro ausgezeichnet. Sie bei
 * einem Franken-Fahrzeug als Franken zu beschriften wäre eine falsche
 * Behauptung über einen fremden Marktplatz — die Zahl bliebe dieselbe, die
 * Aussage wäre falsch.
 *
 * Bleiben sie aber unkommentiert Euro, während der Rest der Seite Franken
 * zeigt, liest der Nutzer das als Fehler. Dieser Hinweis macht aus einer
 * scheinbaren Unstimmigkeit eine erklärte Entscheidung.
 *
 * **Erscheint nur, wenn es einen Unterschied gibt.** Bei einem Euro-Fahrzeug —
 * dem Normalfall — steht hier nichts.
 */
export function ExternalCurrencyNote({ was }: { was: string }) {
  const { currency } = useCurrency();

  if (currency === EXTERNAL_CURRENCY) return null;

  return (
    <p className="text-xs text-muted-foreground">
      {was} {"stehen in "}
      {getCurrencyName(EXTERNAL_CURRENCY)}
      {", nicht in "}
      {getCurrencyName(currency)}
      {" — sie stammen aus dem deutschen Markt und werden nicht umgerechnet."}
    </p>
  );
}
