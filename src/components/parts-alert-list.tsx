"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Bell,
  BellOff,
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowLeft,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
import { CreateAlertDialog } from "@/components/create-alert-dialog";
import { createClient } from "@/lib/supabase";
import {
  formatPriceCents,
  type PartAlert,
} from "@/lib/validations/parts";

const CONDITION_LABELS: Record<string, string> = {
  all: "Alle",
  new: "Nur Neu",
  used: "Nur Gebraucht",
};

interface PartsAlertListProps {
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  initialAlerts: PartAlert[];
}

function AlertCard({
  alert,
  onToggleStatus,
  onDelete,
  isToggling,
}: {
  alert: PartAlert;
  onToggleStatus: () => void;
  onDelete: () => void;
  isToggling: boolean;
}) {
  const isActive = alert.status === "active";

  return (
    <Card className={!isActive ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{alert.search_query}</span>
              <Badge
                variant={isActive ? "default" : "secondary"}
                className="text-xs"
              >
                {isActive ? "Aktiv" : "Pausiert"}
              </Badge>
              {alert.condition_filter !== "all" && (
                <Badge variant="outline" className="text-xs">
                  {CONDITION_LABELS[alert.condition_filter]}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {alert.max_price_cents != null && (
                <span>Max. {formatPriceCents(alert.max_price_cents)}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Erstellt{" "}
                {new Date(alert.created_at).toLocaleDateString("de-DE")}
              </span>
              {alert.last_checked_at && (
                <span>
                  Zuletzt geprüft:{" "}
                  {new Date(alert.last_checked_at).toLocaleDateString("de-DE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              {isToggling ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Switch
                  checked={isActive}
                  onCheckedChange={onToggleStatus}
                  aria-label={isActive ? "Alert pausieren" : "Alert aktivieren"}
                />
              )}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Alert löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Der Such-Alert für &quot;{alert.search_query}&quot; wird
                    unwiderruflich gelöscht. Du erhältst keine Benachrichtigungen
                    mehr.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PartsAlertList({
  vehicleId,
  vehicleMake,
  vehicleModel,
  vehicleYear,
  initialAlerts,
}: PartsAlertListProps) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<PartAlert[]>(initialAlerts);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    setAlerts(initialAlerts);
  }, [initialAlerts]);

  const refreshAlerts = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleToggleStatus = async (alert: PartAlert) => {
    const newStatus = alert.status === "active" ? "paused" : "active";
    setTogglingId(alert.id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("part_alerts")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", alert.id);
      if (error) throw error;
      toast.success(
        newStatus === "active" ? "Alert aktiviert" : "Alert pausiert"
      );
      refreshAlerts();
    } catch {
      toast.error("Fehler beim Aktualisieren");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("part_alerts")
        .delete()
        .eq("id", alertId);
      if (error) throw error;
      toast.success("Alert gelöscht");
      refreshAlerts();
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/vehicles/${vehicleId}/ersatzteile`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-lg font-medium">Such-Alerts</h2>
            <p className="text-sm text-muted-foreground">
              {alerts.length}{" "}
              {alerts.length === 1 ? "Alert" : "Alerts"} für{" "}
              {vehicleMake} {vehicleModel}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Neuer Alert
        </Button>
      </div>

      {/* Alert list */}
      {alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onToggleStatus={() => handleToggleStatus(alert)}
              onDelete={() => handleDelete(alert.id)}
              isToggling={togglingId === alert.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-4">
            Noch keine Such-Alerts erstellt.
          </p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Alert erstellen
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/vehicles/${vehicleId}/ersatzteile`}>
                <Search className="h-3.5 w-3.5 mr-1.5" />
                Ersatzteile suchen
              </Link>
            </Button>
          </div>
        </div>
      )}

      <CreateAlertDialog
        vehicleId={vehicleId}
        vehicleMake={vehicleMake}
        vehicleModel={vehicleModel}
        vehicleYear={vehicleYear}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refreshAlerts}
      />
    </div>
  );
}
