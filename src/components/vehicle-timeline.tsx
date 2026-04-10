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
  Check,
  X,
  FileCheck,
  FileText,
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
import { Input } from "@/components/ui/input";
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
  normalizeCategory,
  type MilestoneCategory,
  type VehicleMilestoneWithImages,
} from "@/lib/validations/milestone";
import {
  DOCUMENT_CATEGORIES,
  getCategoryLabel,
  formatFileSize,
  type VehicleDocument,
  type DocumentCategory,
} from "@/lib/validations/vehicle-document";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function ImageLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const goNext = useCallback(() => setIndex((i) => Math.min(i + 1, images.length - 1)), [images.length]);
  const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const handleTouchEnd = () => {
    if (touchDeltaX.current > 60) goPrev();
    else if (touchDeltaX.current < -60) goNext();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        className="absolute top-4 right-4 z-10 text-white/70 hover:text-white"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>

      {/* Previous */}
      {images.length > 1 && index > 0 && (
        <button
          type="button"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-colors"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Image */}
      <div
        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={images[index]}
          alt=""
          className="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
          draggable={false}
        />
      </div>

      {/* Next */}
      {images.length > 1 && index < images.length - 1 && (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-colors"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/50 px-3 py-1 rounded-full">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

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
  const normalizedCat = normalizeCategory(milestone.category);
  const config = CATEGORY_CONFIG[normalizedCat];
  const Icon = CATEGORY_ICONS[normalizedCat];
  const imageCount = milestone.vehicle_milestone_images?.length ?? 0;
  const firstImage = milestone.vehicle_milestone_images?.[0];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center text-center w-28 sm:w-32 shrink-0 cursor-pointer group transition-all duration-200 ${
        isSelected ? "opacity-100 scale-105" : "opacity-60 hover:opacity-90 hover:scale-[1.02]"
      }`}
    >
      {/* Node on the line */}
      <div className="relative mb-3">
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
            isSelected
              ? `${config.color} ring-2 ring-offset-2 ring-offset-background ring-current shadow-md`
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>

      {/* Thumbnail preview */}
      {firstImage && (
        <div className="w-full aspect-[4/3] rounded-md overflow-hidden bg-muted/30 mb-1.5">
          <img
            src={getImageUrl(firstImage.storage_path, supabaseUrl)}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Date */}
      <p className={`text-[11px] leading-tight ${isSelected ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {format(parse(milestone.milestone_date, "yyyy-MM-dd", new Date()), "MMM yyyy", { locale: de })}
      </p>

      {/* Title */}
      <p className={`text-xs mt-0.5 leading-tight line-clamp-2 ${isSelected ? "font-semibold" : "font-medium"}`}>
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

function DocumentList({
  documents,
  supabaseUrl,
  canEdit,
  onDeleteDocument,
  onUpdateDocument,
}: {
  documents: VehicleDocument[];
  supabaseUrl: string;
  canEdit: boolean;
  onDeleteDocument: (docId: string, storagePath: string) => void;
  onUpdateDocument: (docId: string, updates: { title?: string; category?: DocumentCategory }) => void;
}) {
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<DocumentCategory>("sonstiges");

  if (documents.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        Dokumente ({documents.length})
      </p>
      <div className="space-y-1.5">
        {documents.map((doc) => {
          const fileUrl = `${supabaseUrl}/storage/v1/object/public/vehicle-documents/${doc.storage_path}`;
          const isEditing = editingDocId === doc.id;

          if (isEditing) {
            return (
              <div key={doc.id} className="rounded-md border p-3 space-y-2 bg-muted/30">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Titel"
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditingDocId(null);
                  }}
                />
                <Select value={editCategory} onValueChange={(v) => setEditCategory(v as DocumentCategory)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1.5 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setEditingDocId(null)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      onUpdateDocument(doc.id, { title: editTitle, category: editCategory });
                      setEditingDocId(null);
                    }}
                  >
                    Speichern
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={doc.id}
              className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted/50 transition-colors"
            >
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate flex-1">{doc.title || doc.file_name}</span>
                <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
                  {getCategoryLabel(doc.category)}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatFileSize(doc.file_size)}
                </span>
                <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </a>
              {canEdit && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground"
                    onClick={() => {
                      setEditingDocId(doc.id);
                      setEditTitle(doc.title || doc.file_name);
                      setEditCategory(doc.category);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Dokument löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          &ldquo;{doc.title || doc.file_name}&rdquo; wird unwiderruflich gelöscht.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteDocument(doc.id, doc.storage_path)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MilestoneDetail({
  milestone,
  supabaseUrl,
  documents,
  onEdit,
  onDelete,
  onDeleteImage,
  onDeleteDocument,
  onUpdateDocument,
  canEdit,
}: {
  milestone: VehicleMilestoneWithImages;
  supabaseUrl: string;
  documents: VehicleDocument[];
  onEdit: () => void;
  onDelete: () => void;
  onDeleteImage: (imageId: string, storagePath: string) => void;
  onDeleteDocument: (docId: string, storagePath: string) => void;
  onUpdateDocument: (docId: string, updates: { title?: string; category?: DocumentCategory }) => void;
  canEdit: boolean;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const normalizedCat = normalizeCategory(milestone.category);
  const config = CATEGORY_CONFIG[normalizedCat];
  const Icon = CATEGORY_ICONS[normalizedCat];
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
          {images.map((img, imgIdx) => (
            <div key={img.id} className="shrink-0 w-28 space-y-1 group/img relative">
              <div
                className="w-28 h-28 rounded-md overflow-hidden bg-muted relative cursor-pointer"
                onClick={() => setLightboxIndex(imgIdx)}
              >
                <img
                  src={getImageUrl(img.storage_path, supabaseUrl)}
                  alt={img.caption ?? ""}
                  className="w-full h-full object-contain"
                />
                {canEdit && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/img:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Bild löschen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Dieses Bild wird unwiderruflich gelöscht.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDeleteImage(img.id, img.storage_path)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
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

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images.map((img) => getImageUrl(img.storage_path, supabaseUrl))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <DocumentList
        documents={documents}
        supabaseUrl={supabaseUrl}
        canEdit={canEdit}
        onDeleteDocument={onDeleteDocument}
        onUpdateDocument={onUpdateDocument}
      />
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
  onDeleteImage,
  onDeleteDocument,
  onUpdateCaption,
  onUpdateDocument,
  onSelectMilestone,
  canEdit,
}: {
  milestone: VehicleMilestoneWithImages;
  allRestorations: VehicleMilestoneWithImages[];
  supabaseUrl: string;
  documents: VehicleDocument[];
  onEdit: (ms: VehicleMilestoneWithImages) => void;
  onDelete: (id: string) => void;
  onDeleteImage: (imageId: string, storagePath: string) => void;
  onDeleteDocument: (docId: string, storagePath: string) => void;
  onUpdateCaption: (imageId: string, caption: string) => void;
  onUpdateDocument: (docId: string, updates: { title?: string; category?: DocumentCategory }) => void;
  onSelectMilestone: (id: string) => void;
  canEdit: boolean;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [editingCaptionText, setEditingCaptionText] = useState("");
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
          <div className="mt-5 space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {images.map((img, imgIdx) => {
              const isEditingCaption = editingCaptionId === img.id;
              return (
                <div key={img.id} className="flex gap-5 items-stretch group/img rounded-lg border bg-background overflow-hidden">
                  <div
                    className="shrink-0 w-44 sm:w-56 aspect-[4/3] bg-muted cursor-pointer relative"
                    onClick={() => setLightboxIndex(imgIdx)}
                  >
                    <img
                      src={getImageUrl(img.storage_path, supabaseUrl)}
                      alt={img.caption ?? ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 py-3 pr-4 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 flex-1">
                        Foto {imgIdx + 1} von {images.length}
                      </span>
                      {canEdit && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Bild löschen?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Dieses Bild wird unwiderruflich gelöscht.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteImage(img.id, img.storage_path)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Löschen
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                    {isEditingCaption ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={editingCaptionText}
                          onChange={(e) => setEditingCaptionText(e.target.value)}
                          placeholder="Bildbeschreibung..."
                          className="h-8 text-sm flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              onUpdateCaption(img.id, editingCaptionText);
                              setEditingCaptionId(null);
                            } else if (e.key === "Escape") {
                              setEditingCaptionId(null);
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-green-600"
                          onClick={() => {
                            onUpdateCaption(img.id, editingCaptionText);
                            setEditingCaptionId(null);
                          }}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => setEditingCaptionId(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-1.5">
                        <p className="text-sm text-foreground/80 flex-1 min-w-0 leading-relaxed">
                          {img.caption || (canEdit ? <span className="italic text-muted-foreground/50">Beschreibung hinzufügen...</span> : <span className="text-muted-foreground/40 italic">Keine Beschreibung</span>)}
                        </p>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground"
                            onClick={() => {
                              setEditingCaptionId(img.id);
                              setEditingCaptionText(img.caption ?? "");
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DocumentList
          documents={documents}
          supabaseUrl={supabaseUrl}
          canEdit={canEdit}
          onDeleteDocument={onDeleteDocument}
          onUpdateDocument={onUpdateDocument}
        />
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
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images.map((img) => getImageUrl(img.storage_path, supabaseUrl))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
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

      // Fetch associated images and documents before deleting the milestone
      const [{ data: images }, { data: documents }] = await Promise.all([
        supabase
          .from("vehicle_milestone_images")
          .select("id, storage_path")
          .eq("milestone_id", msId),
        supabase
          .from("vehicle_documents")
          .select("id, storage_path")
          .eq("milestone_id", msId),
      ]);

      // Delete files from storage
      const imagePaths = (images ?? []).map((img) => img.storage_path).filter(Boolean);
      const docPaths = (documents ?? []).map((doc) => doc.storage_path).filter(Boolean);

      await Promise.all([
        imagePaths.length > 0
          ? supabase.storage.from("vehicle-images").remove(imagePaths)
          : Promise.resolve(),
        docPaths.length > 0
          ? supabase.storage.from("vehicle-documents").remove(docPaths)
          : Promise.resolve(),
      ]);

      // Delete milestone (cascade should handle DB rows, but clean up explicitly)
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

  const handleDeleteImage = async (imageId: string, storagePath: string) => {
    try {
      const supabase = createClient();
      await supabase.storage.from("vehicle-images").remove([storagePath]);
      const { error } = await supabase
        .from("vehicle_milestone_images")
        .delete()
        .eq("id", imageId);
      if (error) throw error;
      toast.success("Bild gelöscht");
      refreshMilestones();
    } catch {
      toast.error("Fehler beim Löschen des Bildes");
    }
  };

  const handleDeleteDocument = async (docId: string, storagePath: string) => {
    try {
      const supabase = createClient();
      await supabase.storage.from("vehicle-documents").remove([storagePath]);
      const { error } = await supabase
        .from("vehicle_documents")
        .delete()
        .eq("id", docId);
      if (error) throw error;
      toast.success("Dokument gelöscht");
      refreshMilestones();
    } catch {
      toast.error("Fehler beim Löschen des Dokuments");
    }
  };

  const handleUpdateCaption = async (imageId: string, caption: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("vehicle_milestone_images")
        .update({ caption: caption || null })
        .eq("id", imageId);
      if (error) throw error;
      toast.success("Bildbeschreibung gespeichert");
      refreshMilestones();
    } catch {
      toast.error("Fehler beim Speichern");
    }
  };

  const handleUpdateDocument = async (docId: string, updates: { title?: string; category?: DocumentCategory }) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("vehicle_documents")
        .update(updates)
        .eq("id", docId);
      if (error) throw error;
      toast.success("Dokument aktualisiert");
      refreshMilestones();
    } catch {
      toast.error("Fehler beim Speichern");
    }
  };

  return (
    <div>
      {/* Actions bar */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <h3 className="text-lg font-semibold">Fahrzeug-Historie</h3>
        <div className="flex gap-2">
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
          <div className="relative mb-6 rounded-xl border bg-gradient-to-b from-muted/40 to-muted/10 p-4 sm:p-6 shadow-sm">
            {/* Scroll arrows */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scroll("left")}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-background border border-border shadow-md hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scroll("right")}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-background border border-border shadow-md hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}

            {/* Scrollable container */}
            <div
              ref={scrollRef}
              className="overflow-x-auto scrollbar-hide px-4 touch-pan-x"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="relative flex items-start gap-3 sm:gap-5 pt-4 pb-2 min-w-min">
                {/* Horizontal timeline line */}
                <div className="absolute left-0 right-0 top-[36px] h-[3px] rounded-full bg-gradient-to-r from-primary/30 via-primary/15 to-primary/5" />

                {/* Start cap */}
                <div className="absolute left-0 top-[32px] h-[11px] w-[11px] rounded-full bg-primary/40 border-2 border-primary/60 shadow-sm" />

                {/* Arrow end */}
                <div className="absolute right-0 top-[33px]">
                  <svg width="12" height="12" viewBox="0 0 12 12" className="text-primary/30">
                    <path d="M0 0 L12 6 L0 12" fill="currentColor" />
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
                onDeleteImage={handleDeleteImage}
                onDeleteDocument={handleDeleteDocument}
                onUpdateCaption={handleUpdateCaption}
                onUpdateDocument={handleUpdateDocument}
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
                onDeleteImage={handleDeleteImage}
                onDeleteDocument={handleDeleteDocument}
                onUpdateDocument={handleUpdateDocument}
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
