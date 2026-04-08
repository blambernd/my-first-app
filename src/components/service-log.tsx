"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Wrench,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  formatCentsToEur,
  getNextTuvDate,
  getNextServiceDate,
  getDueStatus,
  type ServiceEntry,
  type ServiceEntryType,
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
}: {
  label: string;
  dateStr: string | null;
  icon: React.ReactNode;
}) {
  if (!dateStr) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          {icon}
          <div>
            <p className="text-lg font-bold text-muted-foreground">–</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = getDueStatus(dateStr);
  const formatted = new Date(dateStr).toLocaleDateString("de-DE");

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        {icon}
        <div>
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
      </CardContent>
    </Card>
  );
}

function ServiceSummary({ entries }: { entries: ServiceEntry[] }) {
  const nextTuv = getNextTuvDate(entries);
  const nextService = getNextServiceDate(entries);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <Wrench className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-2xl font-bold">{entries.length}</p>
            <p className="text-xs text-muted-foreground">Einträge</p>
          </div>
        </CardContent>
      </Card>
      <DueDateCard
        label="Nächster TÜV/HU"
        dateStr={nextTuv}
        icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
      />
      <DueDateCard
        label="Nächster Service"
        dateStr={nextService}
        icon={<Gauge className="h-5 w-5 text-muted-foreground" />}
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
  const hasDetails = entry.notes || entry.next_due_date || documents.length > 0;
  const summaryText = entry.description.length > 120
    ? entry.description.slice(0, 120) + "…"
    : entry.description;

  return (
    <div className="py-4">
      {/* Summary row — always visible */}
      <div
        className={`flex items-start justify-between gap-4 ${hasDetails ? "cursor-pointer" : ""}`}
        onClick={() => hasDetails && setDetailOpen(!detailOpen)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${TYPE_COLORS[entry.entry_type]} border-0 text-xs`}>
              {getEntryTypeLabel(entry.entry_type)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(entry.service_date).toLocaleDateString("de-DE")}
            </span>
            {entry.is_odometer_correction && (
              <Badge variant="outline" className="text-xs">Tacho-Korrektur</Badge>
            )}
          </div>
          <p className="mt-1.5 text-sm">{detailOpen ? entry.description : summaryText}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              {entry.mileage_km.toLocaleString("de-DE")} km
            </span>
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
        {canEdit && (
          <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
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

      {/* Detail panel — shown on click */}
      {detailOpen && (
        <div className="mt-3 ml-0 rounded-lg bg-muted/40 p-4 space-y-3">
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
      <ServiceSummary entries={entries} />

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
