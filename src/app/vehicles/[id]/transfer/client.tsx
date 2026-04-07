"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { TransferForm } from "@/components/transfer-form";
import { TransferStatus } from "@/components/transfer-status";
import type { VehicleTransfer } from "@/lib/validations/transfer";

interface TransferPageClientProps {
  vehicleId: string;
  vehicleName: string;
  activeTransfer: VehicleTransfer | null;
}

export function TransferPageClient({
  vehicleId,
  vehicleName,
  activeTransfer,
}: TransferPageClientProps) {
  const router = useRouter();
  const [transfer, setTransfer] = useState(activeTransfer);

  const refresh = () => {
    router.refresh();
    // Re-fetch will update via server component
    setTransfer(null);
  };

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Achtung:</strong> Nach Bestätigung durch den Empfänger
          verlierst du die Besitzer-Rechte an diesem Fahrzeug. Alle
          bestehenden Kollaborationen (Werkstatt, Betrachter) bleiben
          erhalten.
        </AlertDescription>
      </Alert>

      {transfer ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktiver Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <TransferStatus transfer={transfer} onUpdate={refresh} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Neuen Transfer starten</CardTitle>
          </CardHeader>
          <CardContent>
            <TransferForm
              vehicleId={vehicleId}
              vehicleName={vehicleName}
              onSuccess={refresh}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
