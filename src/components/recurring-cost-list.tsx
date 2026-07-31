"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { Wallet, Plus, Pencil, Trash2, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { RecurringCostForm } from "@/components/recurring-cost-form";
import { formatCentsToEur } from "@/lib/validations/service-entry";
import {
  withProration,
  groupByType,
  currentMonthlyCents,
  yearlyTotalCents,
} from "@/lib/recurring-costs";
import {
  getCostTypeLabel,
  getIntervalLabel,
  type RecurringCost,
} from "@/lib/validations/recurring-cost";

interface RecurringCostListProps {
  vehicleId: string;
  initialCosts: RecurringCost[];
  insuranceCompany: string | null;
  canEdit: boolean;
  canDelete: boolean;
}

function formatPeriod(from: string, to: string): string {
  const f = format(parse(from, "yyyy-MM-dd", new Date()), "MM/yyyy", { locale: de });
  const t = format(parse(to, "yyyy-MM-dd", new Date()), "MM/yyyy", { locale: de });
  return `${f} – ${t}`;
}

export function RecurringCostList({
  vehicleId,
  initialCosts,
  insuranceCompany,
  canEdit,
  canDelete,
}: RecurringCostListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringCost | undefined>();
  const [pendingDelete, setPendingDelete] = useState<RecurringCost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  const { groups, monthlyNow, yearlyNow, currentYear, overlapCount } =
    useMemo(() => {
      const today = format(new Date(), "yyyy-MM-dd");
      const year = new Date().getFullYear();
      const rows = withProration(initialCosts);
      return {
        groups: groupByType(rows),
        monthlyNow: currentMonthlyCents(initialCosts, today),
        yearlyNow: yearlyTotalCents(initialCosts, year),
        currentYear: year,
        overlapCount: rows.filter((r) => r.hasOverlap).length,
      };
    }, [initialCosts]);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(cost: RecurringCost) {
    setEditing(cost);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("recurring_costs")
        .delete()
        .eq("id", pendingDelete.id);
      if (error) throw error;
      toast.success("Eintrag gelöscht");
      setPendingDelete(null);
      router.refresh();
    } catch (error) {
      console.error("Eintrag konnte nicht gelöscht werden:", error);
      toast.error("Löschen fehlgeschlagen");
    } finally {
      setDeleting(false);
    }
  }

  const formProps = {
    vehicleId,
    open: formOpen,
    onOpenChange: setFormOpen,
    onSaved: () => router.refresh(),
    existingCosts: initialCosts,
    insuranceCompany,
  };

  if (initialCosts.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium">Noch keine laufenden Kosten hinterlegt</p>
              <p className="text-sm text-muted-foreground">
                Versicherung, Kfz-Steuer, Garage oder Clubbeitrag — einmal
                erfasst, rechnet die Anwendung sie auf die Monate um.
              </p>
            </div>
            {canEdit && (
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Laufende Kosten erfassen
              </Button>
            )}
          </CardContent>
        </Card>
        <RecurringCostForm {...formProps} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Laufende Kosten</h2>
        {canEdit && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Erfassen
          </Button>
        )}
      </div>

      {/* Kennzahlen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktuell pro Monat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCentsToEur(monthlyNow)}
            </p>
            <p className="text-sm text-muted-foreground">
              Summe der heute laufenden Einträge
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kosten {currentYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCentsToEur(yearlyNow)}</p>
            <p className="text-sm text-muted-foreground">
              nur die Monate, die tatsächlich in {currentYear} fallen
            </p>
          </CardContent>
        </Card>
      </div>

      {overlapCount > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {overlapCount === 2
              ? "Zwei Einträge derselben Kostenart überschneiden sich zeitlich."
              : `${overlapCount} Einträge überschneiden sich zeitlich mit einem anderen derselben Kostenart.`}{" "}
            Für die überlappenden Monate werden beide Beträge gezählt. Beim
            Anbieterwechsel mit Übergangsfrist kann das richtig sein.
          </AlertDescription>
        </Alert>
      )}

      {/* Gruppiert nach Kostenart */}
      <div className="space-y-6">
        {Array.from(groups.entries()).map(([type, rows]) => (
          <div key={type} className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-semibold">{getCostTypeLabel(type)}</h3>
              {rows.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  {rows.length} Zeiträume — Verlauf von neu nach alt
                </span>
              )}
            </div>

            {rows.map((row) => {
              const { cost } = row;
              return (
                <Card key={cost.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {formatPeriod(cost.valid_from, cost.valid_to)}
                          </span>
                          <Badge variant="outline">
                            {getIntervalLabel(cost.payment_interval)}
                          </Badge>
                          {row.hasOverlap && (
                            <Badge
                              variant="secondary"
                              className="gap-1 text-amber-600 dark:text-amber-500"
                            >
                              <AlertTriangle className="h-3 w-3" />
                              Überschneidung
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {formatCentsToEur(cost.amount_cents)} je Zahlung ·{" "}
                          {row.payments}{" "}
                          {row.payments === 1 ? "Zahlung" : "Zahlungen"} ·{" "}
                          {formatCentsToEur(row.totalCents)} gesamt
                        </p>

                        {cost.provider && (
                          <p className="text-sm text-muted-foreground">
                            {cost.provider}
                          </p>
                        )}
                        {cost.notes && (
                          <p className="text-sm text-muted-foreground">
                            {cost.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            {formatCentsToEur(row.monthlyCents)}
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              /Monat
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            über {row.months}{" "}
                            {row.months === 1 ? "Monat" : "Monate"}
                          </p>
                        </div>

                        {(canEdit || canDelete) && (
                          <div className="flex gap-1">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEdit(cost)}
                                aria-label="Laufende Kosten bearbeiten"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPendingDelete(cost)}
                                aria-label="Laufende Kosten löschen"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
      </div>

      <RecurringCostForm {...formProps} cost={editing} />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Eintrag wird dauerhaft entfernt. Die Kennzahlen und die
              Auswertung werden neu berechnet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
