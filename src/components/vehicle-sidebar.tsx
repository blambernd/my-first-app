"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Lock } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  VehicleSwitcher,
  type SwitchableVehicle,
} from "@/components/vehicle-switcher";
import { useSubscription } from "@/hooks/use-subscription";
import {
  getVehicleAreas,
  isAreaActive,
  isSubAreaActive,
  type VehicleArea,
} from "@/lib/vehicle-areas";

/**
 * Mindesthöhe für Bedienflächen auf Touchgeräten (44 px).
 *
 * Die Sidebar-Komponente liefert 32 px (`h-8`) — auf dem Desktop richtig, für
 * den Finger zu wenig. Unterhalb von `lg` gilt deshalb 44 px; genau dort
 * öffnet die Navigation auch als überlagerndes Panel.
 */
const TOUCH_HOEHE = "h-11 lg:h-8";
const TOUCH_HOEHE_SUB = "h-11 lg:h-7";

interface VehicleSidebarProps {
  vehicleId: string;
  isOwner: boolean;
  vehicles: SwitchableVehicle[];
}

/**
 * Schließt das überlagernde Panel nach einer Auswahl (BUG-1).
 *
 * Die Sidebar-Komponente schließt ihr mobiles Panel nicht von selbst, wenn
 * darin ein Link angeklickt wird. Ohne diesen Griff navigiert die Seite zwar
 * korrekt, der Inhalt wechselt aber unsichtbar hinter der Überlagerung — bei
 * jeder einzelnen Navigation auf dem Smartphone.
 *
 * Auf dem Desktop bleibt die Navigation stehen; dort gibt es nichts zu
 * schließen.
 */
function useSchliesseNachAuswahl(): () => void {
  const { isMobile, setOpenMobile } = useSidebar();
  return () => {
    if (isMobile) setOpenMobile(false);
  };
}

export function VehicleSidebar({
  vehicleId,
  isOwner,
  vehicles,
}: VehicleSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const basePath = `/vehicles/${vehicleId}`;
  const areas = getVehicleAreas(isOwner);
  const eingeklappt = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <VehicleSwitcher vehicles={vehicles} currentVehicleId={vehicleId} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {areas.map((area) =>
              area.children && area.children.length > 0 ? (
                <AreaWithChildren
                  key={area.href}
                  area={area}
                  basePath={basePath}
                  pathname={pathname}
                  eingeklappt={eingeklappt}
                />
              ) : (
                <SimpleArea
                  key={area.href}
                  area={area}
                  basePath={basePath}
                  pathname={pathname}
                />
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
      {/* Schmaler Griff am Rand zum Ein- und Ausklappen */}
      <SidebarRail />
    </Sidebar>
  );
}

/**
 * Kennzeichnung für kostenpflichtige Bereiche.
 *
 * Erscheint bewusst erst, wenn der Abostatus bekannt ist. Andernfalls sähe ein
 * zahlender Nutzer für einen Moment eine Kaufaufforderung, die dann wieder
 * verschwindet — das wirkt wie ein Fehler.
 */
function PremiumHinweis({ area }: { area: VehicleArea }) {
  const { data, loading } = useSubscription();

  if (!area.premium || loading || !data) return null;
  if (data.plan !== "free") return null;

  return (
    <SidebarMenuBadge>
      <Lock className="size-3 text-amber-500" />
    </SidebarMenuBadge>
  );
}

function SimpleArea({
  area,
  basePath,
  pathname,
}: {
  area: VehicleArea;
  basePath: string;
  pathname: string;
}) {
  const aktiv = isAreaActive(area, basePath, pathname);
  const Icon = area.icon;
  const schliessen = useSchliesseNachAuswahl();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={aktiv} tooltip={area.label} className={TOUCH_HOEHE}>
        <Link href={`${basePath}${area.href}`} onClick={schliessen}>
          <Icon />
          <span>{area.label}</span>
        </Link>
      </SidebarMenuButton>
      <PremiumHinweis area={area} />
    </SidebarMenuItem>
  );
}

/**
 * Ein Bereich mit Unterbereichen.
 *
 * Zwei Darstellungen, weil im Symbol-Modus schlicht kein Platz für eingerückte
 * Einträge ist:
 *
 * - ausgeklappt: Unterbereiche stehen eingerückt darunter
 * - eingeklappt: ein Klick auf das Symbol öffnet sie als Menü daneben
 *
 * Ohne die zweite Darstellung wären die Kosten-Unterbereiche im Symbol-Modus
 * gar nicht erreichbar.
 */
function AreaWithChildren({
  area,
  basePath,
  pathname,
  eingeklappt,
}: {
  area: VehicleArea;
  basePath: string;
  pathname: string;
  eingeklappt: boolean;
}) {
  const imBereich = isAreaActive(area, basePath, pathname);
  const Icon = area.icon;
  const children = area.children ?? [];
  const schliessen = useSchliesseNachAuswahl();

  if (eingeklappt) {
    return (
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton isActive={imBereich} tooltip={area.label} className={TOUCH_HOEHE}>
              <Icon />
              <span>{area.label}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="min-w-48">
            <DropdownMenuLabel>{area.label}</DropdownMenuLabel>
            {children.map((sub) => (
              <DropdownMenuItem key={sub.href} asChild>
                <Link href={`${basePath}${sub.href}`} onClick={schliessen}>
                  <sub.icon className="size-4" />
                  {sub.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    );
  }

  return (
    // Immer aufgeklappt. Vorher hing es an `imBereich`, also daran, ob man
    // schon in dem Bereich stand — wer ihn von außen suchte, sah nur „Kosten"
    // und musste erst den Pfeil finden. Dazu kam, dass `defaultOpen` nur beim
    // Einhängen greift: Die Seitenleiste bleibt beim Navigieren stehen, das
    // Hineinnavigieren klappte den Bereich also gar nicht auf.
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        {/* Der Name führt in den Bereich, der Pfeil klappt auf.
            Beides auf denselben Klick zu legen wäre eine Verschlechterung:
            Vorher war "Kosten" ein Link, und mit PROJ-31 bekommt der Bereich
            eine eigene Einstiegsseite. */}
        <SidebarMenuButton
          asChild
          isActive={imBereich}
          tooltip={area.label}
          className={TOUCH_HOEHE}
        >
          <Link href={`${basePath}${area.href}`} onClick={schliessen}>
            <Icon />
            <span>{area.label}</span>
          </Link>
        </SidebarMenuButton>

        <CollapsibleTrigger asChild>
          <SidebarMenuAction
            className="top-1/2 -translate-y-1/2 data-[state=open]:rotate-90"
            aria-label={`${area.label} auf- oder zuklappen`}
          >
            <ChevronRight className="transition-transform duration-200" />
          </SidebarMenuAction>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((sub) => (
              <SidebarMenuSubItem key={sub.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isSubAreaActive(sub, basePath, pathname)}
                  className={TOUCH_HOEHE_SUB}
                >
                  <Link href={`${basePath}${sub.href}`} onClick={schliessen}>
                    <sub.icon />
                    <span>{sub.label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
