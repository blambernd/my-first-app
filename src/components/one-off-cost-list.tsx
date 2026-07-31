"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import { Receipt, Plus, Pencil, Trash2, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  OneOffCostForm,
  type ServiceEntryOption,
} from "@/components/one-off-cost-form";
import { formatCentsToEur } from "@/lib/validations/service-entry";
import {
  summarize,
  filterCosts,
  sortNewestFirst,
  countsTowardTotal,
} from "@/lib/one-off-costs";
import {
  ONE_OFF_COST_TYPES,
  getOneOffCostTypeLabel,
  type OneOffCost,
  type OneOffCostType,
} from "@/lib/validations/one-off-cost";

/** Wie viele Einträge zunächst gezeigt werden — Restaurierungen bringen leicht 100+ */
const PAGE_SIZE = 25;

interface OneOffCostListProps {
  vehicleId: string;
  initialCosts: OneOffCost[];
  serviceEntries: ServiceEntryOption[];
  /** Gesamtzahl in der Datenbank — zum Erkennen abgeschnittener Ergebnisse */
  totalInDatabase: number;
  canEdit: boolean;
  canDelete: boolean;
}

export function OneOffCostList({
  vehicleId,
  initialCosts,
  serviceEntries,
  totalInDatabase,
  canEdit,
  canDelete,
}: OneOffCostListProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OneOffCost | undefined>();
  const [pendingDelete, setPendingDelete] = useState<OneOffCost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [typeFilter, setTypeFilter] = useState<OneOffCostType | "all">("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const supabase = createClient();

  // Die Kennzahlen werden über ALLE geladenen Einträge gebildet, nicht über die
  // sichtbare Seite oder das Filterergebnis. Andernfalls stünde "Summe" über
  // einer Zahl, die nur einen Ausschnitt abdeckt.
  const summary = useMemo(() => summarize(initialCosts), [initialCosts]);

  const filtered = useMemo(
    () => sortNewestFirst(filterCosts(initialCosts, { type: typeFilter, search })),
    [initialCosts, typeFilter, search]
  );
  const visible = filtered.slice(0, visibleCount);
  const truncated = totalInDatabase > initialCosts.length;

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(cost: OneOffCost) {
    setEditing(cost);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("one_off_costs")
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
    serviceEntries,
  };

  if (initialCosts.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="font-medium">Noch keine Einzelkosten erfasst</p>
              <p className="text-sm text-muted-foreground">
                Selbst gekaufte Teile, Wertgutachten und Kleinposten — alles, was
                weder im Scheckheft steht noch regelmäßig anfällt.
              </p>
            </div>
            {canEdit && (
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Einzelkosten erfassen
              </Button>
            )}
          </CardContent>
        </Card>
        <OneOffCostForm {...formProps} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">Einzelkosten</h2>
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
              Summe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCentsToEur(summary.totalCents)}
            </p>
            <p className="text-sm text-muted-foreground">
              {summary.entryCount}{" "}
              {summary.entryCount === 1 ? "Eintrag" : "Einträge"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nach Kostenart
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {ONE_OFF_COST_TYPES.filter((t) => summary.byType.has(t.value)).map(
              (t) => (
                <div key={t.value} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t.label}</span>
                  <span className="font-medium">
                    {formatCentsToEur(summary.byType.get(t.value) ?? 0)}
                  </span>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      {summary.excludedCount > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {summary.excludedCount === 1
              ? "Ein Eintrag ist als im Scheckheft enthalten markiert"
              : `${summary.excludedCount} Einträge sind als im Scheckheft enthalten markiert`}{" "}
            und zählt{summary.excludedCount === 1 ? "" : "en"} deshalb nicht zur
            Summe ({formatCentsToEur(summary.excludedCents)}). So wird derselbe
            Betrag nicht zweimal gezählt.
          </AlertDescription>
        </Alert>
      )}

      {truncated && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Es sind {totalInDatabase} Einträge vorhanden, geladen wurden{" "}
            {initialCosts.length}. Die Summen decken deshalb nur den geladenen
            Teil ab.
          </AlertDescription>
        </Alert>
      )}

      {/* Filter und Suche */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Bezeichnung oder Teilenummer suchen"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            aria-label="Einzelkosten durchsuchen"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value as OneOffCostType | "all");
            setVisibleCount(PAGE_SIZE);
          }}
        >
          <SelectTrigger className="sm:w-56" aria-label="Nach Kostenart filtern">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kostenarten</SelectItem>
            {ONE_OFF_COST_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Keine Einträge passen zu Suche und Filter.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((cost) => {
            const counted = countsTowardTotal(cost);
            return (
              <Card key={cost.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{cost.description}</span>
                        <Badge variant="outline">
                          {getOneOffCostTypeLabel(cost.cost_type)}
                        </Badge>
                        {!counted && (
                          <Badge variant="secondary">
                            im Scheckheft enthalten
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {format(
                          parse(cost.purchased_at, "yyyy-MM-dd", new Date()),
                          "dd.MM.yyyy",
                          { locale: de }
                        )}
                        {cost.quantity > 1 && <> · {cost.quantity} Stück</>}
                        {cost.part_number && <> · Nr. {cost.part_number}</>}
                      </p>

                      {cost.source && (
                        <p className="text-sm text-muted-foreground">
                          {cost.source}
                        </p>
                      )}
                      {cost.installed_at && (
                        <p className="text-sm text-muted-foreground">
                          verbaut am{" "}
                          {format(
                            parse(cost.installed_at, "yyyy-MM-dd", new Date()),
                            "dd.MM.yyyy",
                            { locale: de }
                          )}
                        </p>
                      )}
                      {cost.notes && (
                        <p className="text-sm text-muted-foreground">
                          {cost.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <p
                        className={`text-lg font-semibold ${
                          counted ? "" : "text-muted-foreground line-through"
                        }`}
                      >
                        {formatCentsToEur(cost.amount_cents)}
                      </p>

                      {(canEdit || canDelete) && (
                        <div className="flex gap-1">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(cost)}
                              aria-label="Einzelkosten bearbeiten"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPendingDelete(cost)}
                              aria-label="Einzelkosten löschen"
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

          {visible.length < filtered.length && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                Weitere anzeigen ({filtered.length - visible.length})
              </Button>
            </div>
          )}
        </div>
      )}

      <OneOffCostForm {...formProps} cost={editing} />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Eintrag wird dauerhaft entfernt. Bei einer Rückgabe ist das der
              vorgesehene Weg — die Kosten sind dann nicht angefallen.
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
