"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import {
  Plus,
  CalendarIcon,
  Download,
  Pencil,
  Trash2,
  ChevronDown,
  Clock,
  FileCheck,
  HandCoins,
  Hammer,
  AlertTriangle,
  Trophy,
  Paintbrush,
  Wrench,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  MILESTONE_CATEGORIES,
  CATEGORY_CONFIG,
  type MilestoneCategory,
  type VehicleMilestoneWithImages,
} from "@/lib/validations/milestone";

const CATEGORY_ICONS: Record<MilestoneCategory, typeof FileCheck> = {
  erstzulassung: FileCheck,
  kauf: HandCoins,
  restauration: Hammer,
  unfall: AlertTriangle,
  trophaee: Trophy,
  lackierung: Paintbrush,
  umbau: Wrench,
  sonstiges: Flag,
};

const ITEMS_PER_PAGE = 50;

interface VehicleTimelineProps {
  vehicleId: string;
  supabaseUrl: string;
  initialMilestones: VehicleMilestoneWithImages[];
}

function getImageUrl(storagePath: string, supabaseUrl: string): string {
  return `${supabaseUrl}/storage/v1/object/public/vehicle-images/${storagePath}`;
}

function MilestoneCard({
  milestone,
  supabaseUrl,
}: {
  milestone: VehicleMilestoneWithImages;
  supabaseUrl: string;
}) {
  const config = CATEGORY_CONFIG[milestone.category];
  const Icon = CATEGORY_ICONS[milestone.category];
  const images = [...(milestone.vehicle_milestone_images ?? [])].sort(
    (a, b) => a.position - b.position
  );

  return (
    <div className="flex gap-3">
      {/* Category icon */}
      <div
        className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${config.color}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <Badge variant="outline" className="text-xs">
          {config.label}
        </Badge>

        <p className="text-sm font-medium mt-1 line-clamp-2">
          {milestone.title}
        </p>

        {milestone.description && (
          <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line line-clamp-4">
            {milestone.description}
          </p>
        )}

        {/* Photo gallery */}
        {images.length > 0 && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {images.map((img) => (
              <div
                key={img.id}
                className="shrink-0 w-20 h-20 rounded-md overflow-hidden bg-muted"
              >
                <img
                  src={getImageUrl(img.storage_path, supabaseUrl)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function VehicleTimeline({
  vehicleId,
  supabaseUrl,
  initialMilestones,
}: VehicleTimelineProps) {
  const router = useRouter();
  const [milestones, setMilestones] =
    useState<VehicleMilestoneWithImages[]>(initialMilestones);
  const [filterCategory, setFilterCategory] = useState<
    MilestoneCategory | "all"
  >("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<
    VehicleMilestoneWithImages | undefined
  >();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setMilestones(initialMilestones);
  }, [initialMilestones]);

  const filteredMilestones = useMemo(() => {
    let entries = [...milestones].sort((a, b) =>
      b.milestone_date.localeCompare(a.milestone_date)
    );

    if (filterCategory !== "all") {
      entries = entries.filter((e) => e.category === filterCategory);
    }
    if (dateFrom) {
      entries = entries.filter((e) => e.milestone_date >= dateFrom);
    }
    if (dateTo) {
      entries = entries.filter((e) => e.milestone_date <= dateTo);
    }

    return entries;
  }, [milestones, filterCategory, dateFrom, dateTo]);

  const visibleMilestones = filteredMilestones.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMilestones.length;

  // Group by date
  const dateGroups = useMemo(() => {
    const groups = new Map<string, VehicleMilestoneWithImages[]>();
    for (const ms of visibleMilestones) {
      const existing = groups.get(ms.milestone_date);
      if (existing) {
        existing.push(ms);
      } else {
        groups.set(ms.milestone_date, [ms]);
      }
    }
    return groups;
  }, [visibleMilestones]);

  const refreshMilestones = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleNewMilestone = () => {
    setEditingMilestone(undefined);
    setMilestoneDialogOpen(true);
  };

  const handleEditMilestone = (ms: VehicleMilestoneWithImages) => {
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
      if (filterCategory !== "all") params.set("category", filterCategory);

      const response = await fetch(
        `/api/vehicles/${vehicleId}/timeline-pdf?${params.toString()}`
      );

      if (!response.ok) throw new Error("PDF-Export fehlgeschlagen");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Historie_${vehicleId}.pdf`;
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

  const filterButtons: {
    value: MilestoneCategory | "all";
    label: string;
  }[] = [
    { value: "all", label: "Alle" },
    ...MILESTONE_CATEGORIES.map((cat) => ({
      value: cat,
      label: CATEGORY_CONFIG[cat].label,
    })),
  ];

  return (
    <div>
      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h3 className="text-lg font-semibold">Fahrzeug-Historie</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={isExporting || milestones.length === 0}
          >
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

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filterButtons.map((btn) => (
          <Button
            key={btn.value}
            variant={filterCategory === btn.value ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => {
              setFilterCategory(btn.value);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Date range filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Zeitraum:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              {dateFrom
                ? format(
                    parse(dateFrom, "yyyy-MM-dd", new Date()),
                    "dd.MM.yyyy"
                  )
                : "Von"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={
                dateFrom
                  ? parse(dateFrom, "yyyy-MM-dd", new Date())
                  : undefined
              }
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
              {dateTo
                ? format(
                    parse(dateTo, "yyyy-MM-dd", new Date()),
                    "dd.MM.yyyy"
                  )
                : "Bis"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={
                dateTo ? parse(dateTo, "yyyy-MM-dd", new Date()) : undefined
              }
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
      {filteredMilestones.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            {milestones.length === 0
              ? "Dokumentiere die Geschichte deines Fahrzeugs."
              : "Keine Meilensteine für den gewählten Filter."}
          </p>
          {milestones.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleNewMilestone}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Ersten Meilenstein hinzufügen
            </Button>
          )}
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          {Array.from(dateGroups.entries()).map(([date, groupMilestones]) => (
            <div key={date} className="relative mb-6">
              {/* Date heading */}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative z-10 flex items-center justify-center h-8 w-8 rounded-full bg-background border-2 border-border">
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold">
                  {format(
                    parse(date, "yyyy-MM-dd", new Date()),
                    "dd. MMMM yyyy",
                    { locale: de }
                  )}
                </p>
              </div>

              {/* Milestones for this date */}
              <div className="ml-12 space-y-3">
                {groupMilestones.map((ms) => (
                  <div key={ms.id} className="group relative">
                    <MilestoneCard
                      milestone={ms}
                      supabaseUrl={supabaseUrl}
                    />

                    {/* Desktop: hover overlay */}
                    <div className="absolute top-0 right-0 hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditMilestone(ms)}
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
                            <AlertDialogTitle>
                              Meilenstein löschen?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Dieser Meilenstein wird unwiderruflich gelöscht.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMilestone(ms.id)}
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
                        onClick={() => handleEditMilestone(ms)}
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
                            <AlertDialogTitle>
                              Meilenstein löschen?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Dieser Meilenstein wird unwiderruflich gelöscht.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMilestone(ms.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
                Mehr laden ({filteredMilestones.length - visibleCount} weitere)
              </Button>
            </div>
          )}
        </div>
      )}

      <MilestoneForm
        vehicleId={vehicleId}
        supabaseUrl={supabaseUrl}
        milestone={editingMilestone}
        open={milestoneDialogOpen}
        onOpenChange={setMilestoneDialogOpen}
        onSuccess={refreshMilestones}
      />
    </div>
  );
}
