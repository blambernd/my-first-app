import {
  Car,
  BookOpen,
  Clock,
  FileText,
  Fuel,
  Wallet,
  Workflow,
  LayoutDashboard,
  Repeat,
  Receipt,
  ChartColumn,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { VERKAUFSASSISTENT_AKTIV } from "@/lib/feature-flags";

/**
 * Die Bereiche eines Fahrzeugs — an genau einer Stelle (PROJ-30).
 *
 * Vorher war dieselbe Information dreifach gepflegt: einmal in der
 * Fahrzeugnavigation, einmal in der Kosten-Unternavigation und einmal in jeder
 * der vier Kosten-Seiten, die diese Unternavigation einzeln einbanden. Wer
 * einen Bereich hinzufügte, musste alle drei Stellen finden.
 *
 * `enabled: false` blendet einen Bereich vollständig aus — er verschwindet aus
 * der Navigation, ohne dass die Navigation selbst angefasst werden muss. So
 * kehren ausgesetzte Bereiche durch Umlegen eines Schalters zurück.
 */
export interface VehicleArea {
  label: string;
  /** Angehängt an /vehicles/[id] — leer für die Übersicht */
  href: string;
  icon: LucideIcon;
  /** Nur der Besitzer sieht diesen Bereich */
  ownerOnly?: boolean;
  /** Kostenpflichtig; ohne Premium erscheint eine Kennzeichnung */
  premium?: boolean;
  /** Vorübergehend abgeschaltet (siehe lib/feature-flags.ts) */
  enabled?: boolean;
  /** Eingerückte Unterbereiche */
  children?: VehicleArea[];
}

const ALL_AREAS: VehicleArea[] = [
  { label: "Übersicht", href: "", icon: Car },
  { label: "Scheckheft", href: "/scheckheft", icon: BookOpen },
  { label: "Historie", href: "/historie", icon: Clock },
  { label: "Dokumente", href: "/dokumente", icon: FileText },
  { label: "Tankbuch", href: "/tankbuch", icon: Fuel },
  {
    label: "Kosten",
    href: "/kosten",
    icon: Wallet,
    // Der gesamte Kostenbereich ist seit PROJ-27 auf den Besitzer beschränkt —
    // auch in den Zugriffsregeln der Datenbank, nicht nur hier.
    ownerOnly: true,
    children: [
      // Der Überblick liegt auf dem Pfad des Bereichs selbst (PROJ-31);
      // „Laufende Kosten" hat dafür einen eigenen bekommen.
      { label: "Überblick", href: "/kosten", icon: LayoutDashboard },
      { label: "Laufende Kosten", href: "/kosten/laufende", icon: Repeat },
      { label: "Einzelkosten", href: "/kosten/einzelkosten", icon: Receipt },
      { label: "Auswertung", href: "/kosten/auswertung", icon: ChartColumn },
      {
        label: "Wertentwicklung",
        href: "/kosten/wertentwicklung",
        icon: TrendingUp,
      },
    ],
  },
  {
    label: "Verkaufsassistent",
    href: "/verkaufsassistent",
    icon: Workflow,
    ownerOnly: true,
    premium: true,
    // Ausgesetzt am 2026-08-02, siehe features/PROJ-29-*.md
    enabled: VERKAUFSASSISTENT_AKTIV,
  },
];

/**
 * Die Bereiche, die dieser Nutzer sehen soll.
 *
 * Das Ausblenden ist reine Bequemlichkeit — die eigentliche Zugriffsprüfung
 * bleibt serverseitig auf jeder Seite. Wer eine Adresse direkt eingibt, wird
 * weiterhin abgewiesen.
 */
export function getVehicleAreas(isOwner: boolean): VehicleArea[] {
  return ALL_AREAS.filter(
    (area) => area.enabled !== false && (isOwner || !area.ownerOnly)
  );
}

/**
 * Ob ein Bereich zum aktuellen Pfad gehört.
 *
 * Die Übersicht (leerer Pfad) muss exakt übereinstimmen — sonst wäre sie auf
 * jeder Unterseite mit hervorgehoben.
 */
export function isAreaActive(
  area: VehicleArea,
  basePath: string,
  pathname: string
): boolean {
  const full = `${basePath}${area.href}`;
  if (area.href === "") return pathname === basePath;
  return pathname === full || pathname.startsWith(`${full}/`);
}

/**
 * Ob ein Unterbereich der aktive ist.
 *
 * Anders als bei den Hauptbereichen wird hier exakt verglichen: "Laufende
 * Kosten" liegt auf demselben Pfad wie der Bereich "Kosten" und wäre sonst
 * auch auf /kosten/einzelkosten hervorgehoben.
 */
export function isSubAreaActive(
  sub: VehicleArea,
  basePath: string,
  pathname: string
): boolean {
  return pathname === `${basePath}${sub.href}`;
}

/**
 * Wohin der Fahrzeugwechsel führt.
 *
 * Der Nutzer soll auf demselben Unterbereich des anderen Fahrzeugs landen —
 * wer Tankbücher vergleicht, will nicht jedes Mal über die Übersicht.
 *
 * Steht der Bereich am Zielfahrzeug aber nicht zu, muss die Entscheidung
 * **hier** fallen und nicht erst durch die Zugriffsprüfung der Zielseite:
 * Sonst sieht der Nutzer für einen Moment eine Fehlerseite. Betroffen sind die
 * Bereiche, die nur dem Besitzer offenstehen.
 *
 * Als reine Funktion ausgelagert, weil sie sich sonst nur mit zwei Fahrzeugen
 * im Browser prüfen ließe.
 */
export function switchTargetPath(
  currentPath: string,
  currentVehicleId: string,
  target: { id: string; shared: boolean }
): string {
  const basis = `/vehicles/${target.id}`;
  const unterbereich = currentPath.startsWith(`/vehicles/${currentVehicleId}`)
    ? currentPath.slice(`/vehicles/${currentVehicleId}`.length)
    : "";

  if (!unterbereich || unterbereich === "/") return basis;

  const nurBesitzer = ALL_AREAS.some(
    (area) =>
      area.ownerOnly &&
      area.href !== "" &&
      (unterbereich === area.href || unterbereich.startsWith(`${area.href}/`))
  );

  // Auf ein geteiltes Fahrzeug wird ein besitzerpflichtiger Bereich verworfen
  if (target.shared && nurBesitzer) return basis;

  return `${basis}${unterbereich}`;
}
