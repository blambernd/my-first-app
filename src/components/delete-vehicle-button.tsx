"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase";

interface DeleteVehicleButtonProps {
  vehicleId: string;
  vehicleName: string;
}

export function DeleteVehicleButton({ vehicleId, vehicleName }: DeleteVehicleButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const supabase = createClient();

      // Get images to delete from storage
      const { data: images } = await supabase
        .from("vehicle_images")
        .select("storage_path")
        .eq("vehicle_id", vehicleId);

      // Delete images from storage (must happen before vehicle delete, as CASCADE removes DB records)
      if (images && images.length > 0) {
        const paths = images.map((img) => img.storage_path);
        await supabase.storage.from("vehicle-images").remove(paths);
      }

      // Delete vehicle (vehicle_images rows are removed by ON DELETE CASCADE)
      const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);

      if (error) throw error;

      toast.success("Fahrzeug gelöscht");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Fehler beim Löschen. Bitte versuche es erneut.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Löschen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Fahrzeug löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du <strong>{vehicleName}</strong> wirklich löschen? Alle
            zugehörigen Daten werden unwiderruflich entfernt — inklusive Fotos
            und künftig verknüpfter Scheckheft-Einträge.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Endgültig löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
