"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Pencil,
  Shield,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileStatusToggle } from "@/components/profile-status-toggle";
import { DeleteVehicleButton } from "@/components/delete-vehicle-button";

interface VehicleHeaderActionsProps {
  vehicleId: string;
  vehicleName: string;
}

/**
 * Bedienelemente im Fahrzeugkopf (PROJ-30).
 *
 * Vorher standen hier fünf gleichrangige Schaltflächen nebeneinander und
 * drängten den Fahrzeugnamen an den Rand. Sichtbar bleiben nur die beiden
 * häufig gebrauchten — Sichtbarkeit und Bearbeiten. Transfer, Freigabe und
 * Löschen wandern ins Überlaufmenü; ihre Funktion ändert sich nicht.
 */
export function VehicleHeaderActions({
  vehicleId,
  vehicleName,
}: VehicleHeaderActionsProps) {
  // Der Löschdialog liegt außerhalb des Menüs: Ein Klick schließt das Menü,
  // und ein darin liegender Dialog würde mit ihm verschwinden.
  const [loeschenOffen, setLoeschenOffen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <ProfileStatusToggle vehicleId={vehicleId} />

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground h-8 text-xs"
        asChild
      >
        <Link href={`/vehicles/${vehicleId}/edit`}>
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Bearbeiten
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            // Wie beim Navigations-Schalter: 44 px auf dem Smartphone,
            // darüber kompakt. Gemessen waren es 32 × 32.
            className="h-11 w-11 md:h-8 md:w-8 text-muted-foreground hover:text-foreground"
            aria-label="Weitere Aktionen"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem asChild>
            <Link href={`/vehicles/${vehicleId}/transfer`}>
              <ArrowRightLeft className="h-4 w-4" />
              Transfer
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/vehicles/${vehicleId}/mitglieder`}>
              <Shield className="h-4 w-4" />
              Freigabe
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
            onSelect={(e) => {
              // Verhindert, dass das Schließen des Menüs den Fokus dem
              // Dialog wegnimmt, bevor dieser überhaupt offen ist.
              e.preventDefault();
              setLoeschenOffen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Fahrzeug löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteVehicleButton
        vehicleId={vehicleId}
        vehicleName={vehicleName}
        open={loeschenOffen}
        onOpenChange={setLoeschenOffen}
      />
    </div>
  );
}
