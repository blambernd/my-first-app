"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { Lock, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase";
import { VehiclePurchaseForm } from "@/components/vehicle-purchase-form";
import { formatCentsToEur } from "@/lib/validations/service-entry";
import {
  totalAcquisitionCents,
  type VehiclePurchaseWithCosts,
} from "@/lib/validations/vehicle-purchase";

interface VehiclePurchaseSectionProps {
  vehicleId: string;
  purchase: VehiclePurchaseWithCosts | null;
  /** Datum eines vorhandenen Kauf-Meilensteins als Vorbelegung */
  milestoneDate: string | null;
}

/**
 * Abschnitt „Anschaffung" im Fahrzeugprofil.
 *
 * Wird ausschließlich für den Besitzer gerendert. Die Seite entscheidet das —
 * diese Komponente geht davon aus, dass sie gar nicht erst eingebunden wird,
 * wenn jemand anderes zusieht.
 */
export function VehiclePurchaseSection({
  vehicleId,
  purchase,
  milestoneDate,
}: VehiclePurchaseSectionProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  async function handleDelete() {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("vehicle_purchases")
        .delete()
        .eq("vehicle_id", vehicleId);
      if (error) throw error;
      toast.success("Anschaffung entfernt");
      setConfirmDelete(false);
      router.refresh();
    } catch (error) {
      console.error("Anschaffung konnte nicht entfernt werden:", error);
      toast.error("Entfernen fehlgeschlagen");
    } finally {
      setDeleting(false);
    }
  }

  const extraCents = purchase
    ? totalAcquisitionCents(purchase, purchase.extraCosts) - purchase.price_cents
    : 0;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Anschaffung</h3>
          <span
            className="flex items-center gap-1 text-xs text-muted-foreground"
            title="Nur für dich sichtbar"
          >
            <Lock className="h-3 w-3" />
            privat
          </span>
        </div>
        {purchase && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setFormOpen(true)}
              aria-label="Anschaffung bearbeiten"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setConfirmDelete(true)}
              aria-label="Anschaffung entfernen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {purchase ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-muted-foreground">Kaufpreis</span>
            <span className="text-lg font-semibold tabular-nums">
              {formatCentsToEur(purchase.price_cents)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-muted-foreground">Gekauft am</span>
            <span className="text-sm tabular-nums">
              {format(
                parse(purchase.purchased_on, "yyyy-MM-dd", new Date()),
                "dd.MM.yyyy",
                { locale: de }
              )}
            </span>
          </div>

          {purchase.extraCosts.length > 0 && (
            <div className="border-t pt-2">
              <p className="mb-1 text-xs text-muted-foreground">Nebenkosten</p>
              <ul className="space-y-1">
                {purchase.extraCosts.map((cost) => (
                  <li
                    key={cost.id}
                    className="flex justify-between gap-2 text-sm"
                  >
                    <span className="truncate text-muted-foreground">
                      {cost.label}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatCentsToEur(cost.amount_cents)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between gap-2 border-t pt-2 text-sm font-medium">
                <span>Anschaffung gesamt</span>
                <span className="tabular-nums">
                  {formatCentsToEur(purchase.price_cents + extraCents)}
                </span>
              </div>
            </div>
          )}

          {purchase.notes && (
            <p className="border-t pt-2 text-sm text-muted-foreground">
              {purchase.notes}
            </p>
          )}

          {/* Der Verweis auf die Wertentwicklung ist entfallen: Seit dem
              2026-08-03 steht dieser Abschnitt dort selbst, die Auswertung
              beginnt unmittelbar darunter. */}
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">
            Kaufpreis und Kaufdatum hinterlegen — Grundlage für die
            Wertentwicklung. Bleibt das Feld leer, funktioniert alles andere
            unverändert.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Anschaffung erfassen
          </Button>
        </div>
      )}

      <VehiclePurchaseForm
        vehicleId={vehicleId}
        open={formOpen}
        onOpenChange={setFormOpen}
        purchase={purchase}
        milestoneDate={milestoneDate}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anschaffung entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              Kaufpreis, Kaufdatum und alle Nebenkosten werden gelöscht. Die
              Wertentwicklung steht danach nicht mehr zur Verfügung.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              Entfernen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
