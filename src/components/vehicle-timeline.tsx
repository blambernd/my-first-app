"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import {
  Plus,
  Wrench,
  FileText,
  Flag,
  CalendarIcon,
  Gauge,
  Banknote,
  Download,
  Pencil,
  Trash2,
  ChevronDown,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { MilestoneForm } from "@/components/milestone-form";
import { createClient } from "@/lib/supabase";
import { getEntryTypeLabel, formatCentsToEur } from "@/lib/validations/service-entry";
import { getCategoryLabel, formatFileSize } from "@/lib/validations/vehicle-document";
import type { ServiceEntry } from "@/lib/validations/service-entry";
import type { VehicleDocument } from "@/lib/validations/vehicle-document";
import type { VehicleMilestone } from "@/lib/validations/milestone";
import {
  aggregateTimeline,
  groupByDate,
  type TimelineEntry,
  type TimelineSourceType,
} from "@/lib/validations/timeline";

const SOURCE_CONFIG: Record<
  TimelineSourceType,
  { label: string; icon: typeof Wrench; color: string }
> = {
  service: { label: "Scheckheft", icon: Wrench, color: "text-blue-600 bg-blue-100" },
  document: { label: "Dokument", icon: FileText, color: "text-violet-600 bg-violet-100" },
  milestone: { label: "Meilenstein", icon: Flag, color: "text-amber-600 bg-amber-100" },
};

const ITEMS_PER_PAGE = 50;

interface VehicleTimelineProps {
  vehicleId: string;
  initialServiceEntries: ServiceEntry[];
  initialDocuments: VehicleDocument[];
  initialMilestones: VehicleMilestone[];
}

function TimelineEntryCard({ entry }: { entry: TimelineEntry }) {
  const config = SOURCE_CONFIG[entry.sourceType];
  const Icon = config.icon;

  return (
    <div className="flex gap-3">
      {/* Icon */}
      <div
        className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${config.color}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {config.label}
          </Badge>
          {entry.entryType && (
            <Badge variant="secondary" className="text-xs">
              {getEntryTypeLabel(entry.entryType)}
            </Badge>
          )}
          {entry.documentCategory && (
            <Badge variant="secondary" className="text-xs">
              {getCategoryLabel(entry.documentCategory)}
            </Badge>
          )}
          {entry.isOdometerCorrection && (
            <Badge variant="outline" className="text-xs">
              Tacho-Korrektur
            </Badge>
          )}
        </div>

        <p className="text-sm font-medium mt-1 line-clamp-2">{entry.title}</p>

        {entry.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {entry.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {entry.mileageKm !== undefined && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Gauge className="h-3 w-3" />
              {entry.mileageKm.toLocaleString("de-DE")} km
            </span>
          )}
          {entry.costCents != null && entry.costCents > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Banknote className="h-3 w-3" />
              {formatCentsToEur(entry.costCents)}
            </span>
          )}
          {entry.workshopName && (
            <span className="text-xs text-muted-foreground truncate">
              {entry.workshopName}
            </span>
          )}
          {entry.fileName && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              {entry.fileName} · {formatFileSize(entry.fileSize ?? 0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function VehicleTimeline({
  vehicleId,
  initialServiceEntries,
  initialDocuments,
  initialMilestones,
}: VehicleTimelineProps) {
  const router = useRouter();
  const [milestones, setMilestones] = useState<VehicleMilestone[]>(initialMilestones);
  const [filterType, setFilterType] = useState<TimelineSourceType | "all">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<VehicleMilestone | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setMilestones(initialMilestones);
  }, [initialMilestones]);

  const allEntries = useMemo(
    () => aggregateTimeline(initialServiceEntries, initialDocuments, milestones),
    [initialServiceEntries, initialDocuments, milestones]
  );

  const filteredEntries = useMemo(() => {
    let entries = allEntries;

    if (filterType !== "all") {
      entries = entries.filter((e) => e.sourceType === filterType);
    }

    if (dateFrom) {
      entries = entries.filter((e) => e.date >= dateFrom);
    }

    if (dateTo) {
      entries = entries.filter((e) => e.date <= dateTo);
    }

    return entries;
  }, [allEntries, filterType, dateFrom, dateTo]);

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEntries.length;

  const dateGroups = useMemo(() => groupByDate(visibleEntries), [visibleEntries]);

  const refreshMilestones = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleNewMilestone = () => {
    setEditingMilestone(undefined);
    setMilestoneDialogOpen(true);
  };

  const handleEditMilestone = (ms: VehicleMilestone) => {
    setEditingMilestone(ms);
    setMilestoneDialogOpen(true);
  };

  const handleDeleteMilestone = async (msId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("vehicle_milestones")
        .delete()
        .eq("id", msId);
      if (error) throw error;
      toast.success("Meilenstein gelöscht");
      refreshMilestones();
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const response = await fetch(
        `/api/vehicles/${vehicleId}/timeline-pdf?${params.toString()}`
      );

      if (!response.ok) throw new Error("PDF-Export fehlgeschlagen");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Timeline_${vehicleId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF-Export fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setIsExporting(false);
    }
  };

  // Find original milestone from a timeline entry
  const findMilestone = (entryId: string): VehicleMilestone | undefined => {
    const realId = entryId.replace("milestone-", "");
    return milestones.find((m) => m.id === realId);
  };

  const filterButtons: { value: TimelineSourceType | "all"; label: string }[] = [
    { value: "all", label: "Alle" },
    { value: "service", label: "Scheckheft" },
    { value: "document", label: "Dokumente" },
    { value: "milestone", label: "Meilensteine" },
  ];

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{allEntries.length}</p>
              <p className="text-xs text-muted-foreground">Einträge gesamt</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Wrench className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{initialServiceEntries.length}</p>
              <p className="text-xs text-muted-foreground">Scheckheft</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Flag className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">
                {initialDocuments.length + milestones.length}
              </p>
              <p className="text-xs text-muted-foreground">Dokumente & Meilensteine</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((btn) => (
            <Button
              key={btn.value}
              variant={filterType === btn.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilterType(btn.value);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
            >
              {btn.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={isExporting}>
            {isExporting ? (
              <Download className="h-4 w-4 mr-1.5 animate-pulse" />
            ) : (
              <Download className="h-4 w-4 mr-1.5" />
            )}
            PDF
          </Button>
          <Button size="sm" onClick={handleNewMilestone}>
            <Plus className="h-4 w-4 mr-1.5" />
            Meilenstein
          </Button>
        </div>
      </div>

      {/* Date range filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Zeitraum:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              {dateFrom ? format(parse(dateFrom, "yyyy-MM-dd", new Date()), "dd.MM.yyyy") : "Von"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom ? parse(dateFrom, "yyyy-MM-dd", new Date()) : undefined}
              onSelect={(date) => {
                setDateFrom(date ? format(date, "yyyy-MM-dd") : "");
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              locale={de}
            />
          </PopoverContent>
        </Popover>
        <span className="text-sm text-muted-foreground">—</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              {dateTo ? format(parse(dateTo, "yyyy-MM-dd", new Date()), "dd.MM.yyyy") : "Bis"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo ? parse(dateTo, "yyyy-MM-dd", new Date()) : undefined}
              onSelect={(date) => {
                setDateTo(date ? format(date, "yyyy-MM-dd") : "");
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              locale={de}
            />
          </PopoverContent>
        </Popover>
        {(dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setVisibleCount(ITEMS_PER_PAGE);
            }}
          >
            Zurücksetzen
          </Button>
        )}
      </div>

      {/* Timeline */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            {allEntries.length === 0
              ? "Noch keine Einträge. Füge deinen ersten Eintrag hinzu."
              : "Keine Einträge für den gewählten Filter."}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          {Array.from(dateGroups.entries()).map(([date, entries]) => (
            <div key={date} className="relative mb-6">
              {/* Date heading */}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative z-10 flex items-center justify-center h-8 w-8 rounded-full bg-background border-2 border-border">
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">
                  {format(parse(date, "yyyy-MM-dd", new Date()), "dd. MMMM yyyy", {
                    locale: de,
                  })}
                </p>
              </div>

              {/* Entries for this date */}
              <div className="ml-12 space-y-3">
                {entries.map((entry) => (
                  <div key={entry.id} className="group relative">
                    <TimelineEntryCard entry={entry} />

                    {/* Milestone edit/delete actions */}
                    {entry.sourceType === "milestone" && (
                      <>
                        {/* Desktop: hover overlay */}
                        <div className="absolute top-0 right-0 hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const ms = findMilestone(entry.id);
                              if (ms) handleEditMilestone(ms);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Meilenstein löschen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Dieser Meilenstein wird unwiderruflich gelöscht.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteMilestone(entry.id.replace("milestone-", ""))}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        {/* Mobile: always-visible inline buttons */}
                        <div className="flex gap-1 mt-1 ml-11 sm:hidden">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              const ms = findMilestone(entry.id);
                              if (ms) handleEditMilestone(ms);
                            }}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Bearbeiten
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Löschen
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Meilenstein löschen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Dieser Meilenstein wird unwiderruflich gelöscht.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteMilestone(entry.id.replace("milestone-", ""))}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
              >
                <ChevronDown className="h-4 w-4 mr-1.5" />
                Mehr laden ({filteredEntries.length - visibleCount} weitere)
              </Button>
            </div>
          )}
        </div>
      )}

      <MilestoneForm
        vehicleId={vehicleId}
        milestone={editingMilestone}
        open={milestoneDialogOpen}
        onOpenChange={setMilestoneDialogOpen}
        onSuccess={refreshMilestones}
      />
    </div>
  );
}
