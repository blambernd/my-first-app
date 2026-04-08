"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Ban } from "lucide-react";
import { TransferForm } from "@/components/transfer-form";
import { TransferStatus } from "@/components/transfer-status";
import {
  TRANSFER_STATUS_LABELS,
  type VehicleTransfer,
} from "@/lib/validations/transfer";

interface TransferPageClientProps {
  vehicleId: string;
  vehicleName: string;
  activeTransfer: VehicleTransfer | null;
  pastTransfers: VehicleTransfer[];
}

const PAST_STATUS_CONFIG = {
  angenommen: { icon: CheckCircle, color: "text-green-600", badge: "bg-green-100 text-green-800" },
  abgelehnt: { icon: XCircle, color: "text-red-600", badge: "bg-red-100 text-red-800" },
  abgebrochen: { icon: Ban, color: "text-muted-foreground", badge: "bg-gray-100 text-gray-800" },
} as const;

export function TransferPageClient({
  vehicleId,
  vehicleName,
  activeTransfer,
  pastTransfers,
}: TransferPageClientProps) {
  const router = useRouter();
  const [transfer, setTransfer] = useState(activeTransfer);

  const refresh = () => {
    router.refresh();
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
            <TransferStatus transfer={transfer} vehicleName={vehicleName} onUpdate={refresh} />
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

      {/* Transfer-Verlauf */}
      {pastTransfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transfer-Verlauf</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {pastTransfers.map((t) => {
                const config = PAST_STATUS_CONFIG[t.status as keyof typeof PAST_STATUS_CONFIG];
                const Icon = config?.icon ?? Ban;
                return (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${config?.color ?? "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <p className="text-sm truncate">{t.to_email}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString("de-DE")}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${config?.badge ?? "bg-gray-100 text-gray-800"} border-0 text-xs shrink-0`}>
                      {TRANSFER_STATUS_LABELS[t.status]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
