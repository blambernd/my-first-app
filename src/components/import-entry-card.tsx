"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Gauge,
  AlertTriangle,
  FileSearch,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SERVICE_ENTRY_TYPES,
  getEntryTypeLabel,
  type ServiceEntryType,
} from "@/lib/validations/service-entry";
import {
  getMissingFields,
  type DraftField,
  type ImportDraftEntry,
} from "@/lib/validations/scheckheft-import";

interface ImportEntryCardProps {
  draft: ImportDraftEntry;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  onChange: (patch: Partial<ImportDraftEntry>) => void;
  /** Kilometerstand des vorangehenden Eintrags, falls dieser Entwurf die Kette bricht */
  conflictPreviousKm?: number;
  markAsCorrection: boolean;
  onMarkAsCorrectionChange: (value: boolean) => void;
  onShowSource?: (page: number) => void;
}

function formatDate(value: string | null): string {
  if (!value) return "Datum fehlt";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
}

/** Kennzeichnung, woher der Wert eines Feldes stammt. */
function OriginHint({
  draft,
  field,
  required = false,
}: {
  draft: ImportDraftEntry;
  field: DraftField;
  required?: boolean;
}) {
  const origin = draft.field_origins[field];
  const value = draft[field];
  const isEmpty = value === null || value === undefined || value === "";

  if (origin === "edited") {
    return <span className="text-xs text-blue-600 dark:text-blue-400">geändert</span>;
  }
  if (isEmpty) {
    return required ? (
      <span className="text-xs text-amber-600 dark:text-amber-500">
        fehlt — bitte ergänzen
      </span>
    ) : (
      <span className="text-xs text-muted-foreground">nicht erkannt</span>
    );
  }
  return null;
}

export function ImportEntryCard({
  draft,
  selected,
  onSelectedChange,
  onChange,
  conflictPreviousKm,
  markAsCorrection,
  onMarkAsCorrectionChange,
  onShowSource,
}: ImportEntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const missing = getMissingFields(draft);
  const hasConflict = conflictPreviousKm !== undefined && !markAsCorrection;
  const blocked = selected && missing.length > 0;

  const euroValue =
    draft.cost_cents === null ? "" : (draft.cost_cents / 100).toFixed(2);

  return (
    <Card
      className={
        blocked || hasConflict
          ? "border-amber-400 dark:border-amber-600"
          : selected
            ? "border-primary/50"
            : undefined
      }
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={(value) => onSelectedChange(value === true)}
            aria-label={`Eintrag vom ${formatDate(draft.service_date)} übernehmen`}
            className="mt-1 shrink-0"
          />

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="flex-1 min-w-0 text-left"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium">{formatDate(draft.service_date)}</span>
              {draft.entry_type && (
                <Badge variant="secondary">{getEntryTypeLabel(draft.entry_type)}</Badge>
              )}
              {draft.mileage_km !== null && (
                <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" />
                  {draft.mileage_km.toLocaleString("de-DE")} km
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-muted-foreground truncate">
              {draft.workshop_name || draft.description || "Keine weiteren Angaben erkannt"}
            </div>
            {missing.length > 0 && (
              <div className="mt-1.5 text-xs text-amber-600 dark:text-amber-500">
                {missing.length === 1
                  ? "Ein Pflichtfeld fehlt"
                  : `${missing.length} Pflichtfelder fehlen`}
              </div>
            )}
          </button>

          <div className="flex items-center gap-1 shrink-0">
            {draft.source_page !== null && onShowSource && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onShowSource(draft.source_page!)}
                aria-label={`Seite ${draft.source_page} im Beleg anzeigen`}
              >
                <FileSearch className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Zuklappen" : "Aufklappen"}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {hasConflict && (
          <Alert className="mt-3 border-amber-400 dark:border-amber-600">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p>
                Der Kilometerstand liegt unter dem vorherigen Eintrag (
                {conflictPreviousKm.toLocaleString("de-DE")} km). Prüfe, ob die Zahl
                richtig gelesen wurde.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setExpanded(true)}>
                  Zahl korrigieren
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarkAsCorrectionChange(true)}
                >
                  Als Tacho-Korrektur übernehmen
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {markAsCorrection && (
          <div className="mt-3 flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
            <span>Wird als Tacho-Korrektur übernommen.</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onMarkAsCorrectionChange(false)}
            >
              Rückgängig
            </Button>
          </div>
        )}

        {expanded && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`date-${draft.id}`}>Datum</Label>
                <OriginHint draft={draft} field="service_date" required />
              </div>
              <Input
                id={`date-${draft.id}`}
                type="date"
                value={draft.service_date ?? ""}
                onChange={(e) => onChange({ service_date: e.target.value || null })}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`type-${draft.id}`}>Typ</Label>
                <OriginHint draft={draft} field="entry_type" required />
              </div>
              <Select
                value={draft.entry_type ?? ""}
                onValueChange={(value) =>
                  onChange({ entry_type: value as ServiceEntryType })
                }
              >
                <SelectTrigger id={`type-${draft.id}`}>
                  <SelectValue placeholder="Typ wählen" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_ENTRY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`km-${draft.id}`}>Kilometerstand</Label>
                <OriginHint draft={draft} field="mileage_km" required />
              </div>
              <Input
                id={`km-${draft.id}`}
                type="number"
                inputMode="numeric"
                min={0}
                max={9999999}
                placeholder="z.B. 82500"
                value={draft.mileage_km ?? ""}
                onChange={(e) =>
                  onChange({
                    mileage_km: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`workshop-${draft.id}`}>Werkstatt</Label>
                <OriginHint draft={draft} field="workshop_name" />
              </div>
              <Input
                id={`workshop-${draft.id}`}
                maxLength={200}
                placeholder="Nicht erkannt"
                value={draft.workshop_name ?? ""}
                onChange={(e) => onChange({ workshop_name: e.target.value || null })}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`cost-${draft.id}`}>Kosten (€)</Label>
                <OriginHint draft={draft} field="cost_cents" />
              </div>
              <Input
                id={`cost-${draft.id}`}
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="Steht meist nicht im Scheckheft"
                value={euroValue}
                onChange={(e) =>
                  onChange({
                    cost_cents:
                      e.target.value === ""
                        ? null
                        : Math.round(Number(e.target.value) * 100),
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`due-${draft.id}`}>Nächste Fälligkeit</Label>
                <OriginHint draft={draft} field="next_due_date" />
              </div>
              <Input
                id={`due-${draft.id}`}
                type="date"
                value={draft.next_due_date ?? ""}
                onChange={(e) => onChange({ next_due_date: e.target.value || null })}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`desc-${draft.id}`}>Beschreibung</Label>
                <OriginHint draft={draft} field="description" />
              </div>
              <Textarea
                id={`desc-${draft.id}`}
                rows={2}
                maxLength={2000}
                placeholder="Ein Scheckheft-Raster enthält oft keinen Text — du kannst hier selbst etwas ergänzen."
                value={draft.description ?? ""}
                onChange={(e) => onChange({ description: e.target.value || null })}
              />
            </div>

            {draft.source_page !== null && (
              <p className="sm:col-span-2 text-xs text-muted-foreground inline-flex items-center gap-1">
                <FileSearch className="h-3 w-3" />
                Erkannt auf Seite {draft.source_page}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
