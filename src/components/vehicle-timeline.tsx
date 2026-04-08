"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  FileText,
  HandCoins,
  Hammer,
  AlertTriangle,
  Trophy,
  Paintbrush,
  Wrench,
  Flag,
  ArrowRightLeft,
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
  CATEGORY_CONFIG,
  type MilestoneCategory,
  type VehicleMilestoneWithImages,
} from "@/lib/validations/milestone";
import {
  formatFileSize,
  type VehicleDocument,
} from "@/lib/validations/vehicle-document";

const CATEGORY_ICONS: Record<MilestoneCategory, typeof FileCheck> = {
  erstzulassung: FileCheck,
  kauf: HandCoins,
  restauration: Hammer,
  unfall: AlertTriangle,
  trophaee: Trophy,
  lackierung: Paintbrush,
  umbau: Wrench,
  besitzerwechsel: ArrowRightLeft,
  sonstiges: Flag,
};

const ITEMS_PER_PAGE = 50;

interface VehicleTimelineProps {
  vehicleId: string;
  supabaseUrl: string;
  initialMilestones: VehicleMilestoneWithImages[];
  documentsByMilestone?: Record<string, VehicleDocument[]>;
  canEdit?: boolean;
  canEditAll?: boolean;
  userId?: string;
}

function getImageUrl(storagePath: string, supabaseUrl: string): string {
  return `${supabaseUrl}/storage/v1/object/public/vehicle-images/${storagePath}`;
}

function MilestoneCard({
  milestone,
  supabaseUrl,
  isSelected,
  docCount,
  onClick,
}: {
  milestone: VehicleMilestoneWithImages;
  supabaseUrl: string;
  isSelected: boolean;
  docCount: number;
  onClick: () => void;
}) {
  const config = CATEGORY_CONFIG[milestone.category];
  const Icon = CATEGORY_ICONS[milestone.category];
  const imageCount = milestone.vehicle_milestone_images?.length ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center text-center w-24 sm:w-28 shrink-0 cursor-pointer group transition-opacity ${
        isSelected ? "opacity-100" : "opacity-50 hover:opacity-80"
      }`}
    >
      {/* Connector dot on the line */}
      <div className="relative mb-3">
        <div
          className={`h-3 w-3 rounded-full border-2 border-background transition-transform ${
            isSelected ? "bg-primary scale-125" : "bg-border"
          }`}
        />
      </div>

      {/* Category icon */}
      <div
        className={`flex items-center justify-center h-9 w-9 rounded-full shrink-0 ${config.color}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Date */}
      <p className="text-[11px] text-muted-foreground mt-2 leading-tight">
        {format(parse(milestone.milestone_date, "yyyy-MM-dd", new Date()), "MMM yyyy", { locale: de })}
      </p>

      {/* Title */}
      <p className="text-xs font-medium mt-0.5 leading-tight line-clamp-2">
        {milestone.title}
      </p>

      {/* Attachment indicators */}
      {(imageCount > 0 || docCount > 0) && (
        <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
          {imageCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <Clock className="h-2.5 w-2.5" />
              {imageCount}
            </span>
          )}
          {docCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <FileText className="h-2.5 w-2.5" />
              {docCount}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function MilestoneActions({
  canEdit,
  onEdit,
  onDelete,
}: {
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!canEdit) return null;
  return (
    <div className="flex gap-1 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        onClick={onEdit}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
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
            <AlertDialogTitle>Meilenstein löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Meilenstein wird unwiderruflich gelöscht.
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
  );
}

function MilestoneDetail({
  milestone,
  supabaseUrl,
  documents,
  onEdit,
  onDelete,
  canEdit,
}: {
  milestone: VehicleMilestoneWithImages;
  supabaseUrl: string;
  documents: VehicleDocument[];
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
}) {
  const config = CATEGORY_CONFIG[milestone.category];
  const Icon = CATEGORY_ICONS[milestone.category];
  const images = [...(milestone.vehicle_milestone_images ?? [])].sort(
    (a, b) => a.position - b.position
  );

  return (
    <div className="bg-muted/30 rounded-lg p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`flex items-center justify-center h-9 w-9 rounded-full shrink-0 ${config.color}`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(
                  parse(milestone.milestone_date, "yyyy-MM-dd", new Date()),
                  "dd. MMMM yyyy",
                  { locale: de }
                )}
              </span>
            </div>
            <h3 className="text-base font-medium mt-1.5">{milestone.title}</h3>
          </div>
        </div>
        <MilestoneActions canEdit={canEdit} onEdit={onEdit} onDelete={onDelete} />
      </div>

      {milestone.description && (
        <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">
          {milestone.description}
        </p>
      )}

      {/* Photo gallery */}
      {images.length > 0 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
          {images.map((img) => (
            <div key={img.id} className="shrink-0 w-28 space-y-1">
              <div className="w-28 h-28 rounded-md overflow-hidden bg-muted">
                <img
                  src={getImageUrl(img.storage_path, supabaseUrl)}
                  alt={img.caption ?? ""}
                  className="w-full h-full object-contain"
                />
              </div>
              {img.caption && (
                <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                  {img.caption}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Linked documents */}
      {documents.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Dokumente ({documents.length})
          </p>
          <div className="space-y-1.5">
            {documents.map((doc) => {
              const fileUrl = `${supabaseUrl}/storage/v1/object/public/vehicle-documents/${doc.storage_path}`;
              return (
                <a
                  key={doc.id}
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted/50 transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{doc.title || doc.file_name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatFileSize(doc.file_size)}
                  </span>
                  <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RestorationDetail({
  milestone,
  allRestorations,
  supabaseUrl,
  documents,
  onEdit,
  onDelete,
  onSelectMilestone,
  canEdit,
}: {
  milestone: VehicleMilestoneWithImages;
  allRestorations: VehicleMilestoneWithImages[];
  supabaseUrl: string;
  documents: VehicleDocument[];
  onEdit: (ms: VehicleMilestoneWithImages) => void;
  onDelete: (id: string) => void;
  onSelectMilestone: (id: string) => void;
  canEdit: boolean;
}) {
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const images = [...(milestone.vehicle_milestone_images ?? [])].sort(
    (a, b) => a.position - b.position
  );

  return (
    <div className="space-y-4">
      {/* Current restoration entry */}
      <div className="bg-muted/30 rounded-lg p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex items-center justify-center h-9 w-9 rounded-full shrink-0 text-orange-600 bg-orange-100">
              <Hammer className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">Restauration</Badge>
                <span className="text-xs text-muted-foreground">
                  {format(
                    parse(milestone.milestone_date, "yyyy-MM-dd", new Date()),
                    "dd. MMMM yyyy",
                    { locale: de }
                  )}
                </span>
              </div>
              <h3 className="text-base font-medium mt-1.5">{milestone.title}</h3>
            </div>
          </div>
          <MilestoneActions canEdit={canEdit} onEdit={() => onEdit(milestone)} onDelete={() => onDelete(milestone.id)} />
        </div>

        {milestone.description && (
          <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line">
            {milestone.description}
          </p>
        )}

        {/* Photo gallery — vertical list with captions beside */}
        {images.length > 0 && (
          <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {images.map((img) => (
              <div key={img.id} className="flex gap-4 items-start">
                <div
                  className="shrink-0 w-40 sm:w-52 aspect-[4/3] rounded-lg overflow-hidden bg-muted cursor-pointer"
                  onClick={() => setLightboxImg(getImageUrl(img.storage_path, supabaseUrl))}
                >
                  <img
                    src={getImageUrl(img.storage_path, supabaseUrl)}
                    alt={img.caption ?? ""}
                    className="w-full h-full object-contain"
                  />
                </div>
                {img.caption && (
                  <p className="text-sm text-muted-foreground pt-1 flex-1 min-w-0">
                    {img.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Linked documents */}
        {documents.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Dokumente ({documents.length})
            </p>
            <div className="space-y-1.5">
              {documents.map((doc) => {
                const fileUrl = `${supabaseUrl}/storage/v1/object/public/vehicle-documents/${doc.storage_path}`;
                return (
                  <a
                    key={doc.id}
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted/50 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{doc.title || doc.file_name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatFileSize(doc.file_size)}
                    </span>
                    <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Restoration timeline overview */}
      {allRestorations.length > 1 && (
        <div className="rounded-lg border p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Hammer className="h-4 w-4 text-orange-600" />
            Restaurationsverlauf ({allRestorations.length} Einträge)
          </h4>
          <div className="space-y-0">
            {allRestorations.map((r, idx) => {
              const isActive = r.id === milestone.id;
              const rImages = r.vehicle_milestone_images ?? [];
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelectMilestone(r.id)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-md transition-colors ${
                    isActive ? "bg-orange-50 border border-orange-200" : "hover:bg-muted/50"
                  }`}
                >
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center pt-1">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${isActive ? "bg-orange-500" : "bg-border"}`} />
                    {idx < allRestorations.length - 1 && (
                      <div className="w-px flex-1 bg-border mt-1 min-h-[20px]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(parse(r.milestone_date, "yyyy-MM-dd", new Date()), "dd.MM.yyyy")}
                      </span>
                      {rImages.length > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {rImages.length} Foto{rImages.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-0.5 truncate ${isActive ? "font-medium" : ""}`}>
                      {r.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

export function VehicleTimeline({
  vehicleId,
  supabaseUrl,
  initialMilestones,
  documentsByMilestone = {},
  canEdit = true,
  canEditAll = true,
  userId,
}: VehicleTimelineProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [milestones, setMilestones] =
    useState<VehicleMilestoneWithImages[]>(initialMilestones);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<
    VehicleMilestoneWithImages | undefined
  >();
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    null
  );
  const [isExporting, setIsExporting] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    setMilestones(initialMilestones);
  }, [initialMilestones]);

  const filteredMilestones = useMemo(() => {
    // Sort oldest first for left-to-right timeline
    let entries = [...milestones].sort((a, b) =>
      a.milestone_date.localeCompare(b.milestone_date)
    );

    if (dateFrom) {
      entries = entries.filter((e) => e.milestone_date >= dateFrom);
    }
    if (dateTo) {
      entries = entries.filter((e) => e.milestone_date <= dateTo);
    }

    return entries;
  }, [milestones, dateFrom, dateTo]);

  const visibleMilestones = filteredMilestones.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMilestones.length;

  const selectedMilestone = useMemo(
    () => visibleMilestones.find((ms) => ms.id === selectedMilestoneId) ?? null,
    [visibleMilestones, selectedMilestoneId]
  );

  // Auto-select first milestone when filter changes
  useEffect(() => {
    if (visibleMilestones.length > 0 && !selectedMilestone) {
      setSelectedMilestoneId(visibleMilestones[0].id);
    }
  }, [visibleMilestones, selectedMilestone]);

  // Scroll state tracking
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState);
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, visibleMilestones]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -200 : 200,
      behavior: "smooth",
    });
  };

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
      setSelectedMilestoneId(null);
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

  return (
    <div>
      {/* Actions bar */}
      <div className="flex items-center justify-between gap-3 mb-6">
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
          {canEdit && (
            <Button size="sm" onClick={handleNewMilestone}>
              <Plus className="h-4 w-4 mr-1.5" />
              Meilenstein
            </Button>
          )}
        </div>
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

      {/* Horizontal timeline */}
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
        <>
          {/* Timeline rail */}
          <div className="relative mb-6">
            {/* Scroll arrows */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-background border border-border shadow-sm hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-background border border-border shadow-sm hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {/* Scrollable container */}
            <div
              ref={scrollRef}
              className="overflow-x-auto scrollbar-hide px-6"
            >
              <div className="relative flex items-start gap-4 sm:gap-6 pt-4 pb-2 min-w-min">
                {/* Horizontal timeline line — aligned to center of dots (dot is 12px, mb-3=12px from top of card, so center at 6px + 16px padding = 22px) */}
                <div className="absolute left-0 right-0 top-[22px] h-[2px] bg-gradient-to-r from-border via-border to-transparent" />

                {/* Start cap */}
                <div className="absolute left-0 top-[19px] h-2 w-2 rounded-full bg-primary/40" />

                {/* Arrow end */}
                <div className="absolute right-0 top-[18px]">
                  <svg width="10" height="10" viewBox="0 0 10 10" className="text-border">
                    <path d="M0 0 L10 5 L0 10" fill="currentColor" />
                  </svg>
                </div>

                {visibleMilestones.map((ms) => (
                  <MilestoneCard
                    key={ms.id}
                    milestone={ms}
                    supabaseUrl={supabaseUrl}
                    isSelected={selectedMilestoneId === ms.id}
                    docCount={(documentsByMilestone[ms.id] ?? []).length}
                    onClick={() => setSelectedMilestoneId(ms.id)}
                  />
                ))}
              </div>
            </div>

            {/* Load more inline */}
            {hasMore && (
              <div className="text-center mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                >
                  <ChevronDown className="h-4 w-4 mr-1.5" />
                  Mehr laden ({filteredMilestones.length - visibleCount} weitere)
                </Button>
              </div>
            )}
          </div>

          {/* Selected milestone detail */}
          {selectedMilestone && (
            selectedMilestone.category === "restauration" ? (
              <RestorationDetail
                milestone={selectedMilestone}
                allRestorations={filteredMilestones.filter((m) => m.category === "restauration")}
                supabaseUrl={supabaseUrl}
                documents={documentsByMilestone[selectedMilestone.id] ?? []}
                canEdit={canEdit && (canEditAll || selectedMilestone.created_by === userId)}
                onEdit={handleEditMilestone}
                onDelete={handleDeleteMilestone}
                onSelectMilestone={setSelectedMilestoneId}
              />
            ) : (
              <MilestoneDetail
                milestone={selectedMilestone}
                supabaseUrl={supabaseUrl}
                documents={documentsByMilestone[selectedMilestone.id] ?? []}
                canEdit={canEdit && (canEditAll || selectedMilestone.created_by === userId)}
                onEdit={() => handleEditMilestone(selectedMilestone)}
                onDelete={() => handleDeleteMilestone(selectedMilestone.id)}
              />
            )
          )}
        </>
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
