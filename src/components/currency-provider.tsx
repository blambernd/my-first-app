"use client";

import { createContext, useContext, useMemo } from "react";
import {
  formatMoney,
  getCurrencySymbol,
  type Currency,
} from "@/lib/currency";

/**
 * Stellt die Währung des Fahrzeugs allen Unterseiten zur Verfügung (PROJ-36).
 *
 * ## Warum bereitstellen und nicht durchreichen
 *
 * Das Fahrzeug-Grundgerüst (`vehicles/[id]/layout.tsx`) lädt das Fahrzeug
 * ohnehin schon mit allen Spalten, für jede Unterseite, bei jedem Aufruf. Die
 * Währung ist dort also **ohne eine einzige zusätzliche Abfrage** vorhanden.
 *
 * Die einzelnen Seiten holen das Fahrzeug dagegen mit gezielten, schmalen
 * Abfragen — das Tankbuch etwa nur Kennung und Kilometerstand. Beim
 * Durchreichen müsste jede dieser Abfragen erweitert werden, und **jede
 * vergessene wäre ein Fahrzeug, das plötzlich wieder Euro anzeigt.** Genau
 * diese Fehlerklasse macht der Bereitsteller unmöglich.
 */
interface CurrencyContextValue {
  currency: Currency;
  /** Kleinsteinheiten → fertige Anzeige, in der Währung des Fahrzeugs */
  formatMoney: (cents: number) => string;
  /** Nur das Zeichen, für die Beschriftung von Eingabefeldern */
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: Currency;
  children: React.ReactNode;
}) {
  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      formatMoney: (cents: number) => formatMoney(cents, currency),
      symbol: getCurrencySymbol(currency),
    }),
    [currency]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Die Währung des aktuellen Fahrzeugs.
 *
 * Wirft ohne Bereitsteller einen Fehler, statt auf Euro zurückzufallen. Ein
 * stiller Rückfall hieße: Eine Seite außerhalb des Fahrzeug-Grundgerüsts
 * zeigt Franken-Beträge mit Euro-Zeichen an, und niemandem fällt es auf. So
 * bricht es sofort und sichtbar — beim Entwickeln und in den E2E-Tests, also
 * genau dann, wenn man es noch bemerken kann.
 *
 * Dasselbe Vorgehen wie bei `useSidebar` in components/ui/sidebar.tsx.
 */
export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error(
      "useCurrency muss innerhalb eines CurrencyProvider verwendet werden — " +
        "er hängt im Fahrzeug-Grundgerüst (vehicles/[id]/layout.tsx)."
    );
  }
  return context;
}
