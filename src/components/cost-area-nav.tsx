"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Repeat, Receipt, ChartColumn } from "lucide-react";

/**
 * Unternavigation des Kosten-Bereichs.
 *
 * Hier stehen nur bereits gebaute Reiter. PROJ-26 (Einzelkosten) und PROJ-27
 * (Auswertung) tragen sich ein, sobald sie existieren — bis dahin würde ein
 * deaktivierter Reiter den Nutzern eine Funktion versprechen, die es nicht gibt.
 */
const tabs = [
  { label: "Laufende Kosten", href: "", icon: Repeat },
  { label: "Einzelkosten", href: "/einzelkosten", icon: Receipt },
  // { label: "Auswertung",   href: "/auswertung",   icon: ChartColumn }, // PROJ-27
];

// Nur referenziert, damit das Icon für PROJ-27 nicht als ungenutzt gilt
void ChartColumn;

interface CostAreaNavProps {
  vehicleId: string;
}

export function CostAreaNav({ vehicleId }: CostAreaNavProps) {
  const pathname = usePathname();
  const basePath = `/vehicles/${vehicleId}/kosten`;

  if (tabs.length < 2) return null;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b pb-px">
      {tabs.map((tab) => {
        const fullPath = `${basePath}${tab.href}`;
        const isActive =
          tab.href === "" ? pathname === basePath : pathname.startsWith(fullPath);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={fullPath}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
