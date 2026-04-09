"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Wrench,
  Droplets,
  Filter,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Gauge,
  Banknote,
  FileText,
  Download,
  Image,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ServiceEntryForm } from "@/components/service-entry-form";
import { createClient } from "@/lib/supabase";
import {
  SERVICE_ENTRY_TYPES,
  getEntryTypeLabel,
  OIL_CHANGE_CATEGORIES,
  getOilCategoryLabel,
  formatCentsToEur,
  getNextTuvDate,
  getNextServiceDate,
  getNextOilChangeDate,
  getAllOilChangeDueDates,
  getDueStatus,
  type ServiceEntry,
  type ServiceEntryType,
  type OilChangeCategory,
} from "@/lib/validations/service-entry";
import {
  formatFileSize,
  isImageMimeType,
  type VehicleDocument,
} from "@/lib/validations/vehicle-document";

const TYPE_COLORS: Record<ServiceEntryType, string> = {
  inspection: "bg-blue-100 text-blue-800",
  oil_change: "bg-amber-100 text-amber-800",
  repair: "bg-red-100 text-red-800",
  tuv_hu: "bg-green-100 text-green-800",
  restoration: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
};

interface ServiceLogProps {
  vehicleId: string;
  supabaseUrl: string;
  initialEntries: ServiceEntry[];
  documentsByEntry?: Record<string, VehicleDocument[]>;
  canEdit?: boolean;
  canEditAll?: boolean;
  userId?: string;
}

const DUE_STATUS_STYLES = {
  overdue: "text-destructive",
  soon: "text-yellow-600",
  ok: "text-foreground",
} as const;

const DUE_STATUS_BADGE = {
  overdue: "bg-red-100 text-red-800",
  soon: "bg-yellow-100 text-yellow-800",
  ok: "",
} as const;

function DueDateCard({
  label,
  dateStr,
  icon,
  canEdit,
  onSave,
}: {
  label: string;
  dateStr: string | null;
  icon: React.ReactNode;
  canEdit?: boolean;
  onSave?: (date: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const handleEdit = () => {
    setEditValue(dateStr || "");
    setEditing(true);
  };

  const handleSave = () => {
    if (editValue && onSave) {
      onSave(editValue);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-2">{label}</p>
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-8 text-sm flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleSave}>
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dateStr) {
    return (
      <Card className={canEdit ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""} onClick={canEdit ? handleEdit : undefined}>
        <CardContent className="p-4 flex items-center gap-3">
          {icon}
          <div className="flex-1">
            <p className="text-lg font-bold text-muted-foreground">–</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
          {canEdit && <Pencil className="h-3.5 w-3.5 text-muted-foreground" />}
        </CardContent>
      </Card>
    );
  }

  const status = getDueStatus(dateStr);
  const formatted = new Date(dateStr).toLocaleDateString("de-DE");

  return (
    <Card className={canEdit ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""} onClick={canEdit ? handleEdit : undefined}>
      <CardContent className="p-4 flex items-center gap-3">
        {icon}
        <div className="flex-1">
          <p className={`text-lg font-bold ${DUE_STATUS_STYLES[status]}`}>
            {formatted}
          </p>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">{label}</p>
            {status === "overdue" && (
              <Badge className={`${DUE_STATUS_BADGE.overdue} border-0 text-[10px] px-1.5 py-0`}>
                Überfällig
              </Badge>
            )}
            {status === "soon" && (
              <Badge className={`${DUE_STATUS_BADGE.soon} border-0 text-[10px] px-1.5 py-0`}>
                Bald fällig
              </Badge>
            )}
          </div>
        </div>
        {canEdit && <Pencil className="h-3.5 w-3.5 text-muted-foreground" />}
      </CardContent>
    </Card>
  );
}

const OIL_DUE_TYPE_MAP: Record<OilChangeCategory, string> = {
  motor_oil: "oil_motor_oil",
  transmission_oil: "oil_transmission_oil",
  rear_axle_oil: "oil_rear_axle_oil",
  other_oil: "oil_other_oil",
};

function OilChangeDueDateCard({
  entries,
  overrides,
  canEdit,
  onSaveCategory,
}: {
  entries: ServiceEntry[];
  overrides: DueDateOverride[];
  canEdit: boolean;
  onSaveCategory: (dueType: string, date: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const entryDueDates = getAllOilChangeDueDates(entries);

  // Merge entry-based dates with overrides per category
  const allCategories = OIL_CHANGE_CATEGORIES.map((cat) => {
    const dueType = OIL_DUE_TYPE_MAP[cat.value as OilChangeCategory];
    const override = overrides.find((o) => o.due_type === dueType)?.due_date;
    const fromEntry = entryDueDates.find((d) => d.category === cat.value);
    const date = override || fromEntry?.date || null;
    return {
      category: cat.value as OilChangeCategory,
      label: fromEntry?.label || cat.label,
      date,
      dueType,
      isOverride: !!override,
    };
  });

  const categoriesWithDates = allCategories.filter((c) => c.date);
  const categoriesWithoutDates = allCategories.filter((c) => !c.date);

  // Find the earliest due date for the main display
  const earliest = categoriesWithDates.length > 0
    ? categoriesWithDates.reduce((a, b) => (a.date! < b.date! ? a : b))
    : null;

  const nextOilDate = earliest?.date || null;

  const handleStartEdit = (category: string, currentDate: string | null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCategory(category);
    setEditValue(currentDate || "");
  };

  const handleSave = (dueType: string) => {
    if (editValue) {
      onSaveCategory(dueType, editValue);
    }
    setEditingCategory(null);
    setEditValue("");
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setEditValue("");
  };

  if (!nextOilDate && !canEdit) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Droplets className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-lg font-bold text-muted-foreground">–</p>
            <p className="text-xs text-muted-foreground">Nächster Ölwechsel</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!nextOilDate && canEdit) {
    return (
      <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setExpanded(!expanded)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Droplets className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-lg font-bold text-muted-foreground">–</p>
              <p className="text-xs text-muted-foreground">Nächster Ölwechsel</p>
            </div>
            {expanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
          {expanded && (
            <div className="mt-3 pt-3 border-t space-y-2">
              {allCategories.map((item) => (
                <OilSubcategoryRow
                  key={item.category}
                  item={item}
                  canEdit={canEdit}
                  editingCategory={editingCategory}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  onStartEdit={handleStartEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const status = getDueStatus(nextOilDate!);
  const formatted = new Date(nextOilDate!).toLocaleDateString("de-DE");
  const mainLabel = earliest
    ? `Nächster Ölwechsel (${earliest.label})`
    : "Nächster Ölwechsel";

  return (
    <Card className="transition-colors">
      <CardContent className="p-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <Droplets className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <p className={`text-lg font-bold ${DUE_STATUS_STYLES[status]}`}>
              {formatted}
            </p>
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-muted-foreground">{mainLabel}</p>
              {status === "overdue" && (
                <Badge className={`${DUE_STATUS_BADGE.overdue} border-0 text-[10px] px-1.5 py-0`}>
                  Überfällig
                </Badge>
              )}
              {status === "soon" && (
                <Badge className={`${DUE_STATUS_BADGE.soon} border-0 text-[10px] px-1.5 py-0`}>
                  Bald fällig
                </Badge>
              )}
            </div>
          </div>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2">
            {allCategories.map((item) => (
              <OilSubcategoryRow
                key={item.category}
                item={item}
                canEdit={canEdit}
                editingCategory={editingCategory}
                editValue={editValue}
                setEditValue={setEditValue}
                onStartEdit={handleStartEdit}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OilSubcategoryRow({
  item,
  canEdit,
  editingCategory,
  editValue,
  setEditValue,
  onStartEdit,
  onSave,
  onCancel,
}: {
  item: { category: string; label: string; date: string | null; dueType: string };
  canEdit: boolean;
  editingCategory: string | null;
  editValue: string;
  setEditValue: (v: string) => void;
  onStartEdit: (category: string, date: string | null, e?: React.MouseEvent) => void;
  onSave: (dueType: string) => void;
  onCancel: () => void;
}) {
  if (editingCategory === item.category) {
    return (
      <div className="flex items-center gap-1.5">
        <Droplets className="h-3 w-3 text-amber-600 shrink-0" />
        <span className="text-sm shrink-0">{item.label}</span>
        <Input
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-7 text-xs flex-1"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave(item.dueType);
            if (e.key === "Escape") onCancel();
          }}
        />
        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => onSave(item.dueType)}>
          <Check className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (item.date) {
    const itemStatus = getDueStatus(item.date);
    return (
      <div
        className={`flex items-center justify-between text-sm ${canEdit ? "cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 py-0.5" : ""}`}
        onClick={canEdit ? (e) => onStartEdit(item.category, item.date, e) : undefined}
      >
        <div className="flex items-center gap-2">
          <Droplets className="h-3 w-3 text-amber-600" />
          <span>{item.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={DUE_STATUS_STYLES[itemStatus]}>
            {new Date(item.date).toLocaleDateString("de-DE")}
          </span>
          {itemStatus === "overdue" && (
            <Badge className={`${DUE_STATUS_BADGE.overdue} border-0 text-[10px] px-1.5 py-0`}>
              Überfällig
            </Badge>
          )}
          {itemStatus === "soon" && (
            <Badge className={`${DUE_STATUS_BADGE.soon} border-0 text-[10px] px-1.5 py-0`}>
              Bald fällig
            </Badge>
          )}
          {canEdit && <Pencil className="h-3 w-3 text-muted-foreground" />}
        </div>
      </div>
    );
  }

  // No date — show "add" option
  if (canEdit) {
    return (
      <div
        className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 py-0.5 text-muted-foreground"
        onClick={(e) => onStartEdit(item.category, null, e)}
      >
        <div className="flex items-center gap-2">
          <Droplets className="h-3 w-3" />
          <span>{item.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs">Termin hinzufügen</span>
          <Plus className="h-3 w-3" />
        </div>
      </div>
    );
  }

  return null;
}

interface DueDateOverride {
  due_type: string;
  due_date: string;
}

function ServiceSummary({
  entries,
  vehicleId,
  canEdit,
}: {
  entries: ServiceEntry[];
  vehicleId: string;
  canEdit: boolean;
}) {
  const [overrides, setOverrides] = useState<DueDateOverride[]>([]);

  useEffect(() => {
    async function loadOverrides() {
      try {
        const res = await fetch(`/api/vehicles/${vehicleId}/due-dates`);
        if (res.ok) {
          const data = await res.json();
          setOverrides(data.dueDates || []);
        }
      } catch {
        // Silently fail — calculated dates still show
      }
    }
    loadOverrides();
  }, [vehicleId]);

  const tuvOverride = overrides.find((o) => o.due_type === "tuv_hu")?.due_date;
  const serviceOverride = overrides.find((o) => o.due_type === "service")?.due_date;
  const oilOverrides = overrides.filter((o) => o.due_type.startsWith("oil_"));

  const nextTuv = tuvOverride || getNextTuvDate(entries);
  const nextService = serviceOverride || getNextServiceDate(entries);

  const handleSaveDueDate = async (dueType: string, date: string) => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/due-dates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ due_type: dueType, due_date: date }),
      });
      if (res.ok) {
        const data = await res.json();
        setOverrides((prev) => {
          const filtered = prev.filter((o) => o.due_type !== dueType);
          return [...filtered, data.dueDate];
        });
        toast.success("Termin gespeichert");
      }
    } catch {
      toast.error("Fehler beim Speichern");
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <OilChangeDueDateCard
        entries={entries}
        overrides={oilOverrides}
        canEdit={canEdit}
        onSaveCategory={handleSaveDueDate}
      />
      <DueDateCard
        label="Nächster TÜV/HU"
        dateStr={nextTuv}
        icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
        canEdit={canEdit}
        onSave={(date) => handleSaveDueDate("tuv_hu", date)}
      />
      <DueDateCard
        label="Nächste Inspektion"
        dateStr={nextService}
        icon={<Gauge className="h-5 w-5 text-muted-foreground" />}
        canEdit={canEdit}
        onSave={(date) => handleSaveDueDate("service", date)}
      />
    </div>
  );
}

function ServiceEntryCard({
  entry,
  onEdit,
  onDelete,
  canEdit,
  documents,
  supabaseUrl,
}: {
  entry: ServiceEntry;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  documents: VehicleDocument[];
  supabaseUrl: string;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const hasOilCategories = entry.oil_change_categories && entry.oil_change_categories.length > 0;
  const hasDetails = entry.notes || entry.next_due_date || documents.length > 0 || hasOilCategories;
  const summaryText = entry.description.length > 120
    ? entry.description.slice(0, 120) + "…"
    : entry.description;

  return (
    <div className="py-4">
      {/* Summary row — always visible */}
      <div
        className={`${hasDetails ? "cursor-pointer" : ""}`}
        onClick={() => hasDetails && setDetailOpen(!detailOpen)}
      >
        <div className="flex items-start gap-2">
          <Badge className={`${TYPE_COLORS[entry.entry_type]} border-0 text-xs shrink-0 mt-0.5`}>
            {getEntryTypeLabel(entry.entry_type)}
          </Badge>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">
                  {new Date(entry.service_date).toLocaleDateString("de-DE")}
                </span>
                {entry.is_odometer_correction && (
                  <Badge variant="outline" className="text-xs">Tacho-Korrektur</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                  {entry.mileage_km.toLocaleString("de-DE")} km
                </span>
            {canEdit && (
            <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dieser Scheckheft-Eintrag wird unwiderruflich gelöscht.
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
          )}
              </div>
            </div>
            <p className="mt-1 text-sm">{detailOpen ? entry.description : summaryText}</p>
            <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
              {entry.cost_cents != null && entry.cost_cents > 0 && (
                <span className="flex items-center gap-1">
                  <Banknote className="h-3 w-3" />
                  {formatCentsToEur(entry.cost_cents)}
                </span>
              )}
              {documents.length > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {documents.length}
                </span>
              )}
              {entry.workshop_name && (
                <span className="truncate">{entry.workshop_name}</span>
              )}
              {hasDetails && (
                <span className="flex items-center gap-0.5 text-primary ml-auto">
                  {detailOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail panel — shown on click */}
      {detailOpen && (
        <div className="mt-3 ml-0 rounded-lg bg-muted/40 p-4 space-y-3">
          {hasOilCategories && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Ölkategorien</p>
              <div className="space-y-1">
                {entry.oil_change_categories!.map((cat) => (
                  <div key={cat.category} className="flex items-center gap-2 text-sm">
                    <Droplets className="h-3 w-3 text-amber-600" />
                    <span>
                      {cat.category === "other_oil" && cat.custom_label
                        ? cat.custom_label
                        : getOilCategoryLabel(cat.category)}
                    </span>
                    {cat.next_due_date && (
                      <span className="text-xs text-muted-foreground">
                        — fällig {new Date(cat.next_due_date).toLocaleDateString("de-DE")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {entry.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Notizen</p>
              <p className="text-sm italic">{entry.notes}</p>
            </div>
          )}
          {entry.next_due_date && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Nächster Termin</p>
              <p className="text-sm flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                {new Date(entry.next_due_date).toLocaleDateString("de-DE")}
              </p>
            </div>
          )}
          {documents.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Dokumente ({documents.length})
              </p>
              <div className="space-y-1.5">
                {documents.map((doc) => {
                  const fileUrl = `${supabaseUrl}/storage/v1/object/public/vehicle-documents/${doc.storage_path}`;
                  const isImg = isImageMimeType(doc.mime_type);
                  return (
                    <a
                      key={doc.id}
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md border bg-background p-2 hover:bg-muted/50 transition-colors"
                    >
                      {isImg ? (
                        <Image className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{doc.title || doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </p>
                      </div>
                      <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ServiceLog({ vehicleId, supabaseUrl, initialEntries, documentsByEntry = {}, canEdit = true, canEditAll = true, userId }: ServiceLogProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<ServiceEntry[]>(initialEntries);
  const [filterType, setFilterType] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ServiceEntry | undefined>();

  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  const filteredEntries =
    filterType === "all"
      ? entries
      : entries.filter((e) => e.entry_type === filterType);

  const lastMileage = entries.length > 0
    ? Math.max(...entries.map((e) => e.mileage_km))
    : undefined;

  const refreshEntries = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleEdit = (entry: ServiceEntry) => {
    setEditingEntry(entry);
    setSheetOpen(true);
  };

  const handleNew = () => {
    setEditingEntry(undefined);
    setSheetOpen(true);
  };

  const handleDelete = async (entryId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("service_entries")
        .delete()
        .eq("id", entryId);
      if (error) throw error;
      toast.success("Eintrag gelöscht");
      refreshEntries();
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  return (
    <div>
      <ServiceSummary entries={entries} vehicleId={vehicleId} canEdit={canEdit} />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              {SERVICE_ENTRY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canEdit && (
          <Button size="sm" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1.5" />
            Neuer Eintrag
          </Button>
        )}
      </div>

      {filteredEntries.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            {filterType === "all"
              ? "Noch keine Scheckheft-Einträge. Erstelle den ersten Eintrag."
              : "Keine Einträge für diesen Typ."}
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {filteredEntries.map((entry) => {
            const canEditThis = canEdit && (canEditAll || entry.created_by === userId);
            return (
              <ServiceEntryCard
                key={entry.id}
                entry={entry}
                canEdit={canEditThis}
                documents={documentsByEntry[entry.id] || []}
                supabaseUrl={supabaseUrl}
                onEdit={() => handleEdit(entry)}
                onDelete={() => handleDelete(entry.id)}
              />
            );
          })}
        </div>
      )}

      <ServiceEntryForm
        vehicleId={vehicleId}
        entry={editingEntry}
        lastMileage={lastMileage}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={refreshEntries}
      />
    </div>
  );
}
