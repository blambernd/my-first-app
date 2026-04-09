"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Filter,
  Trash2,
  Download,
  FileImage,
  FolderOpen,
  Pencil,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { DocumentUploadForm } from "@/components/document-upload-form";
import { createClient } from "@/lib/supabase";
import {
  DOCUMENT_CATEGORIES,
  getCategoryLabel,
  formatFileSize,
  isImageMimeType,
  type VehicleDocument,
  type DocumentCategory,
} from "@/lib/validations/vehicle-document";
import type { ServiceEntry } from "@/lib/validations/service-entry";
import {
  CATEGORY_CONFIG,
  type VehicleMilestoneWithImages,
  type VehicleMilestoneImage,
} from "@/lib/validations/milestone";

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  datenkarte: "bg-teal-100 text-teal-800",
  rechnung: "bg-blue-100 text-blue-800",
  gutachten: "bg-emerald-100 text-emerald-800",
  tuev_bericht: "bg-green-100 text-green-800",
  kaufvertrag: "bg-violet-100 text-violet-800",
  versicherung: "bg-orange-100 text-orange-800",
  zulassung: "bg-cyan-100 text-cyan-800",
  sonstiges: "bg-gray-100 text-gray-800",
};

interface MilestoneImageEntry {
  image: VehicleMilestoneImage;
  milestoneTitle: string;
  milestoneCategory: string;
  milestoneDate: string;
}

interface DocumentArchiveProps {
  vehicleId: string;
  initialDocuments: VehicleDocument[];
  serviceEntries: ServiceEntry[];
  milestones?: VehicleMilestoneWithImages[];
  supabaseUrl: string;
  canEdit?: boolean;
  canEditAll?: boolean;
  userId?: string;
}

function DocumentCard({
  document,
  supabaseUrl,
  onDelete,
  onDownload,
  canEdit,
}: {
  document: VehicleDocument;
  supabaseUrl: string;
  onDelete: () => void;
  onDownload: () => void;
  canEdit: boolean;
}) {
  const isImage = isImageMimeType(document.mime_type);
  const fileUrl = `${supabaseUrl}/storage/v1/object/public/vehicle-documents/${document.storage_path}`;

  return (
    <Card className="overflow-hidden group">
      {/* Thumbnail / Icon area */}
      <div className="aspect-[4/3] bg-muted flex items-center justify-center relative">
        {isImage ? (
          <img
            src={fileUrl}
            alt={document.title}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <FileText className="h-12 w-12 text-muted-foreground/40" />
        )}
        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors hidden sm:flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8"
            onClick={onDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          {canEdit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Dokument löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &ldquo;{document.title}&rdquo; wird unwiderruflich gelöscht.
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
          )}
        </div>
      </div>
      <CardContent className="p-3 space-y-1.5">
        <p className="text-sm font-medium truncate" title={document.title}>
          {document.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            className={`${CATEGORY_COLORS[document.category]} border-0 text-xs`}
          >
            {getCategoryLabel(document.category)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(document.document_date).toLocaleDateString("de-DE")}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground truncate flex-1 min-w-0">
            {document.file_name} · {formatFileSize(document.file_size)}
          </p>
          {/* Mobile-visible action buttons (hidden on desktop where hover overlay works) */}
          <div className="flex gap-1 sm:hidden shrink-0 ml-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onDownload}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            {canEdit && (
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
                    <AlertDialogTitle>Dokument löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      &ldquo;{document.title}&rdquo; wird unwiderruflich gelöscht.
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
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ImageGallery({
  images,
  supabaseUrl,
  canEdit,
  canEditAll,
  userId,
  onDelete,
  onUpdateDescription,
}: {
  images: VehicleDocument[];
  supabaseUrl: string;
  canEdit: boolean;
  canEditAll: boolean;
  userId?: string;
  onDelete: (doc: VehicleDocument) => void;
  onUpdateDescription: (docId: string, description: string) => void;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const goNext = useCallback(() => setLightboxIndex((i) => i !== null ? Math.min(i + 1, images.length - 1) : null), [images.length]);
  const goPrev = useCallback(() => setLightboxIndex((i) => i !== null ? Math.max(i - 1, 0) : null), []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, goNext, goPrev]);

  if (images.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <FileImage className="h-4 w-4 text-muted-foreground" />
        Bildergalerie ({images.length})
      </h3>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {images.map((img, imgIdx) => {
          const fileUrl = `${supabaseUrl}/storage/v1/object/public/vehicle-documents/${img.storage_path}`;
          const canEditThis = canEdit && (canEditAll || img.created_by === userId);
          const isEditing = editingId === img.id;

          return (
            <div key={img.id} className="flex gap-4 items-start group/img rounded-lg border p-3">
              <div
                className="shrink-0 w-36 sm:w-48 aspect-[4/3] rounded-lg overflow-hidden bg-muted cursor-pointer relative"
                onClick={() => setLightboxIndex(imgIdx)}
              >
                <img
                  src={fileUrl}
                  alt={img.description ?? img.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
                {canEditThis && (
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
                          &ldquo;{img.title}&rdquo; wird unwiderruflich gelöscht.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(img)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Löschen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium truncate">{img.title}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${CATEGORY_COLORS[img.category]} border-0 text-xs`}>
                    {getCategoryLabel(img.category)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(img.document_date).toLocaleDateString("de-DE")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(img.file_size)}
                  </span>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      placeholder="Bildbeschreibung..."
                      className="h-8 text-sm flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onUpdateDescription(img.id, editingText);
                          setEditingId(null);
                        } else if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-green-600"
                      onClick={() => {
                        onUpdateDescription(img.id, editingText);
                        setEditingId(null);
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5 mt-1">
                    <p className="text-sm text-muted-foreground flex-1 min-w-0">
                      {img.description || (canEditThis ? <span className="italic text-muted-foreground/50">Beschreibung hinzufügen...</span> : null)}
                    </p>
                    {canEditThis && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground"
                        onClick={() => {
                          setEditingId(img.id);
                          setEditingText(img.description ?? "");
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

      {/* Lightbox with swipe navigation */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 z-10 text-white/70 hover:text-white"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && lightboxIndex > 0 && (
            <button
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-colors"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; }}
            onTouchMove={(e) => { touchDeltaX.current = e.touches[0].clientX - touchStartX.current; }}
            onTouchEnd={() => { if (touchDeltaX.current > 60) goPrev(); else if (touchDeltaX.current < -60) goNext(); }}
          >
            <img
              src={`${supabaseUrl}/storage/v1/object/public/vehicle-documents/${images[lightboxIndex].storage_path}`}
              alt={images[lightboxIndex].title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
              draggable={false}
            />
          </div>

          {images.length > 1 && lightboxIndex < images.length - 1 && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-colors"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/50 px-3 py-1 rounded-full">
              {lightboxIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HistorieGallery({
  entries,
  supabaseUrl,
}: {
  entries: MilestoneImageEntry[];
  supabaseUrl: string;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const goNext = useCallback(() => setLightboxIndex((i) => i !== null ? Math.min(i + 1, entries.length - 1) : null), [entries.length]);
  const goPrev = useCallback(() => setLightboxIndex((i) => i !== null ? Math.max(i - 1, 0) : null), []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, goNext, goPrev]);

  if (entries.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        Historie ({entries.length})
      </h3>
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {entries.map((entry, idx) => {
          const fileUrl = `${supabaseUrl}/storage/v1/object/public/vehicle-images/${entry.image.storage_path}`;
          const categoryConfig = CATEGORY_CONFIG[entry.milestoneCategory as keyof typeof CATEGORY_CONFIG];

          return (
            <div key={entry.image.id} className="flex gap-4 items-start rounded-lg border p-3">
              <div
                className="shrink-0 w-36 sm:w-48 aspect-[4/3] rounded-lg overflow-hidden bg-muted cursor-pointer"
                onClick={() => setLightboxIndex(idx)}
              >
                <img
                  src={fileUrl}
                  alt={entry.image.caption ?? entry.milestoneTitle}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium truncate">{entry.milestoneTitle}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {categoryConfig && (
                    <Badge className={`${categoryConfig.color} border-0 text-xs`}>
                      {categoryConfig.label}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.milestoneDate).toLocaleDateString("de-DE")}
                  </span>
                  {"file_size" in entry.image && entry.image.file_size ? (
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(entry.image.file_size as number)}
                    </span>
                  ) : null}
                </div>
                {entry.image.caption && (
                  <p className="text-sm text-muted-foreground">{entry.image.caption}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox with swipe navigation */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 z-10 text-white/70 hover:text-white"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-6 w-6" />
          </button>

          {entries.length > 1 && lightboxIndex > 0 && (
            <button
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-colors"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div
            className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchDeltaX.current = 0; }}
            onTouchMove={(e) => { touchDeltaX.current = e.touches[0].clientX - touchStartX.current; }}
            onTouchEnd={() => { if (touchDeltaX.current > 60) goPrev(); else if (touchDeltaX.current < -60) goNext(); }}
          >
            <img
              src={`${supabaseUrl}/storage/v1/object/public/vehicle-images/${entries[lightboxIndex].image.storage_path}`}
              alt={entries[lightboxIndex].image.caption ?? entries[lightboxIndex].milestoneTitle}
              className="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
              draggable={false}
            />
          </div>

          {entries.length > 1 && lightboxIndex < entries.length - 1 && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-colors"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          {entries.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/50 px-3 py-1 rounded-full">
              {lightboxIndex + 1} / {entries.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DocumentArchive({
  vehicleId,
  initialDocuments,
  serviceEntries,
  milestones = [],
  supabaseUrl,
  canEdit = true,
  canEditAll = true,
  userId,
}: DocumentArchiveProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<VehicleDocument[]>(initialDocuments);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [uploadOpen, setUploadOpen] = useState(false);

  const imageDocuments = documents.filter((d) => isImageMimeType(d.mime_type));
  const nonImageDocuments = documents.filter((d) => !isImageMimeType(d.mime_type));

  const milestoneImageEntries: MilestoneImageEntry[] = milestones.flatMap((m) =>
    m.vehicle_milestone_images.map((img) => ({
      image: img,
      milestoneTitle: m.title,
      milestoneCategory: m.category,
      milestoneDate: m.milestone_date,
    }))
  );

  const filteredDocuments =
    filterCategory === "all"
      ? nonImageDocuments
      : nonImageDocuments.filter((d) => d.category === filterCategory);

  const refreshDocuments = useCallback(() => {
    router.refresh();
  }, [router]);

  // Sync from server when initialDocuments changes
  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const handleDownload = async (doc: VehicleDocument) => {
    const url = `${supabaseUrl}/storage/v1/object/public/vehicle-documents/${doc.storage_path}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.file_name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (doc: VehicleDocument) => {
    try {
      const supabase = createClient();

      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from("vehicle-documents")
        .remove([doc.storage_path]);
      if (storageError) throw storageError;

      // Delete DB record
      const { error: dbError } = await supabase
        .from("vehicle_documents")
        .delete()
        .eq("id", doc.id);
      if (dbError) throw dbError;

      // Clear linked milestone description (e.g. Datenkarte reference)
      if (doc.milestone_id) {
        await supabase
          .from("vehicle_milestones")
          .update({ description: null })
          .eq("id", doc.milestone_id);
      }

      toast.success("Dokument gelöscht");
      refreshDocuments();
    } catch {
      toast.error("Fehler beim Löschen");
    }
  };

  const handleUpdateDescription = async (docId: string, description: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("vehicle_documents")
        .update({ description: description || null })
        .eq("id", docId);
      if (error) throw error;
      toast.success("Beschreibung gespeichert");
      refreshDocuments();
    } catch {
      toast.error("Fehler beim Speichern");
    }
  };

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{documents.length}</p>
              <p className="text-xs text-muted-foreground">Dokumente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileImage className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">
                {documents.filter((d) => isImageMimeType(d.mime_type)).length + milestoneImageEntries.length}
              </p>
              <p className="text-xs text-muted-foreground">Bilder</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">
                {documents.filter((d) => d.mime_type === "application/pdf").length}
              </p>
              <p className="text-xs text-muted-foreground">PDFs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload button */}
      <div className="flex items-center justify-end mb-4">
        {canEdit && (
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Hochladen
          </Button>
        )}
      </div>

      {/* Image gallery */}
      <ImageGallery
        images={imageDocuments}
        supabaseUrl={supabaseUrl}
        canEdit={canEdit}
        canEditAll={canEditAll}
        userId={userId}
        onDelete={handleDelete}
        onUpdateDescription={handleUpdateDescription}
      />

      {/* Historie images from milestones */}
      <HistorieGallery
        entries={milestoneImageEntries}
        supabaseUrl={supabaseUrl}
      />

      {/* Document filter */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {DOCUMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document grid (non-image files only) */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            {filterCategory === "all"
              ? "Noch keine Dokumente. Lade das erste Dokument hoch."
              : "Keine Dokumente in dieser Kategorie."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => {
            const canEditThis = canEdit && (canEditAll || doc.created_by === userId);
            return (
              <DocumentCard
                key={doc.id}
                document={doc}
                supabaseUrl={supabaseUrl}
                canEdit={canEditThis}
                onDelete={() => handleDelete(doc)}
                onDownload={() => handleDownload(doc)}
              />
            );
          })}
        </div>
      )}

      <DocumentUploadForm
        vehicleId={vehicleId}
        serviceEntries={serviceEntries}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={refreshDocuments}
      />
    </div>
  );
}
