"use client";

import { useRouter, usePathname } from "next/navigation";
import { Car, ChevronsUpDown, Plus, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { switchTargetPath } from "@/lib/vehicle-areas";

export interface SwitchableVehicle {
  id: string;
  make: string;
  model: string;
  /** Eigenes Fahrzeug oder als Mitglied/Werkstatt geteilt */
  shared: boolean;
}

interface VehicleSwitcherProps {
  vehicles: SwitchableVehicle[];
  currentVehicleId: string;
}

export function VehicleSwitcher({
  vehicles,
  currentVehicleId,
}: VehicleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const current =
    vehicles.find((v) => v.id === currentVehicleId) ?? vehicles[0] ?? null;
  const eigene = vehicles.filter((v) => !v.shared);
  const geteilte = vehicles.filter((v) => v.shared);

  const name = current ? `${current.make} ${current.model}` : "Fahrzeug";

  /**
   * Wechselt auf denselben Unterbereich des Zielfahrzeugs.
   *
   * Der Kostenbereich steht nur Besitzern offen. Wer von dort auf ein
   * geteiltes Fahrzeug wechselt, landet sonst auf einer Fehlerseite — deshalb
   * wird der Unterbereich hier **vor** dem Wechsel verworfen, nicht erst durch
   * die Zugriffsprüfung der Zielseite.
   */
  function wechselZu(ziel: SwitchableVehicle) {
    if (ziel.id === currentVehicleId) return;
    // Sonst bliebe auf dem Smartphone das überlagernde Panel offen und der
    // Fahrzeugwechsel liefe unsichtbar dahinter ab (BUG-1).
    if (isMobile) setOpenMobile(false);
    router.push(switchTargetPath(pathname, currentVehicleId, ziel));
  }

  function neuesFahrzeug() {
    if (isMobile) setOpenMobile(false);
    router.push("/vehicles/new");
  }

  // Bei nur einem Fahrzeug gibt es nichts zu wählen — dann darf es auch nicht
  // wie eine Schaltfläche aussehen.
  if (vehicles.length < 2) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Car className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{name}</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Car className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  Fahrzeug wechseln
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 max-h-80 overflow-y-auto"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            {/* Leere Überschriften werden weggelassen — ein Nutzer, der nur
                als Werkstatt eingeladen wurde, hat keine eigenen Fahrzeuge. */}
            {eigene.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Meine Fahrzeuge
                </DropdownMenuLabel>
                {eigene.map((v) => (
                  <VehicleItem
                    key={v.id}
                    vehicle={v}
                    active={v.id === currentVehicleId}
                    onSelect={() => wechselZu(v)}
                  />
                ))}
              </>
            )}

            {geteilte.length > 0 && (
              <>
                {eigene.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Geteilte Fahrzeuge
                </DropdownMenuLabel>
                {geteilte.map((v) => (
                  <VehicleItem
                    key={v.id}
                    vehicle={v}
                    active={v.id === currentVehicleId}
                    onSelect={() => wechselZu(v)}
                  />
                ))}
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={neuesFahrzeug}>
              <Plus className="size-4" />
              Fahrzeug anlegen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function VehicleItem({
  vehicle,
  active,
  onSelect,
}: {
  vehicle: SwitchableVehicle;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem onSelect={onSelect} className="gap-2">
      <span className="truncate">
        {vehicle.make} {vehicle.model}
      </span>
      {active && <Check className="ml-auto size-4 shrink-0" />}
    </DropdownMenuItem>
  );
}
