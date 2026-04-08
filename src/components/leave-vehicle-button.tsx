"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Loader2 } from "lucide-react";
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

interface LeaveVehicleButtonProps {
  vehicleId: string;
  vehicleName: string;
}

export function LeaveVehicleButton({ vehicleId, vehicleName }: LeaveVehicleButtonProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  async function handleLeave() {
    setIsLeaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Nicht angemeldet");

      const { error } = await supabase
        .from("vehicle_members")
        .delete()
        .eq("vehicle_id", vehicleId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Fahrzeug verlassen");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Fehler beim Verlassen. Bitte versuche es erneut.");
    } finally {
      setIsLeaving(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          Verlassen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Fahrzeug verlassen?</AlertDialogTitle>
          <AlertDialogDescription>
            Du wirst keinen Zugriff mehr auf <strong>{vehicleName}</strong> haben.
            Der Besitzer kann dich jederzeit erneut einladen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLeaving}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLeave}
            disabled={isLeaving}
          >
            {isLeaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verlassen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
