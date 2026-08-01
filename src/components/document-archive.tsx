"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Trash2,
  Download,
  FolderOpen,
  Pencil,
  Check,
  X,
  Search,
  Archive,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ImageLightbox, type LightboxImage } from "@/components/image-lightbox";
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

type ArchiveKind = "dokument" | "bild" | "historie";
type SortKey = "neueste" | "aelteste" | "titel" | "groesse";

/**
 * Dokumente, hochgeladene Bilder und Bilder aus der Historie stammen aus drei
 * Quellen mit unterschiedlichen Feldern. Für die Anzeige werden sie auf eine
 * gemeinsame Form gebracht — nur so lassen sich Suche, Filter und Sortierung
 * über alles hinweg anwenden statt je Abschnitt getrennt.
 */
interface ArchiveItem {
  id: string;
  kind: ArchiveKind;
  title: string;
  date: string;
  categoryKey: string;
  categoryLabel: string;
  categoryColor: string;
  fileName: string | null;
  fileSize: number | null;
  previewUrl: string | null;
  description: string | null;
  /** Löschen bzw. Beschreibung ändern erlaubt. */
  canModify: boolean;
  document?: VehicleDocument;
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

function ArchiveCard({
  item,
  onOpenImage,
  onDownload,
  onDelete,
  onUpdateDescription,
  selectMode,
  selected,
  onToggleSelect,
}: {
  item: ArchiveItem;
  onOpenImage?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onUpdateDescription?: (description: string) => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(item.description ?? "");

  const canEditDescription = item.kind === "bild" && item.canModify && onUpdateDescription;

  return (
    <Card
      className={`overflow-hidden group ${selectMode ? "cursor-pointer" : ""} ${
        selected ? "ring-2 ring-primary" : ""
      }`}
      onClick={selectMode ? onToggleSelect : undefined}
    >
      <div className="aspect-[4/3] bg-muted flex items-center justify-center relative">
        {selectMode && (
          <div className="absolute top-2 left-2 z-10">
            <Checkbox checked={selected} />
          </div>
        )}

        {item.previewUrl ? (
          <button
            type="button"
            disabled={selectMode}
            onClick={onOpenImage}
            aria-label={`${item.title} formatfüllend anzeigen`}
            className="w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.previewUrl}
              alt={item.description || item.title}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </button>
        ) : (
          <FileText className="h-12 w-12 text-muted-foreground/40" />
        )}

        {!selectMode && (onDownload || onDelete) && (
          <div className="absolute top-1.5 right-1.5 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity">
            {onDownload && (
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 shadow-sm"
                onClick={onDownload}
                aria-label={`${item.title} herunterladen`}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7 shadow-sm"
                    aria-label={`${item.title} löschen`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {item.kind === "bild" ? "Bild löschen?" : "Dokument löschen?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      &ldquo;{item.title}&rdquo; wird unwiderruflich gelöscht.
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
        )}
      </div>

      <CardContent className="p-3 space-y-1.5">
        <p className="text-sm font-medium truncate" title={item.title}>
          {item.title}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${item.categoryColor} border-0 text-xs`}>
            {item.categoryLabel}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(item.date).toLocaleDateString("de-DE")}
          </span>
        </div>

        {(item.fileName || item.fileSize != null) && (
          <p className="text-xs text-muted-foreground truncate">
            {[item.fileName, item.fileSize != null ? formatFileSize(item.fileSize) : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        {isEditing ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Bildbeschreibung…"
              className="h-7 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onUpdateDescription?.(draft);
                  setIsEditing(false);
                } else if (e.key === "Escape") {
                  setIsEditing(false);
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-green-600"
              aria-label="Beschreibung speichern"
              onClick={() => {
                onUpdateDescription?.(draft);
                setIsEditing(false);
              }}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              aria-label="Bearbeiten abbrechen"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          (item.description || canEditDescription) && (
            <div className="flex items-start gap-1">
              <p className="text-xs text-muted-foreground flex-1 min-w-0 line-clamp-2">
                {item.description || (
                  <span className="italic text-muted-foreground/50">
                    Beschreibung hinzufügen…
                  </span>
                )}
              </p>
              {canEditDescription && !selectMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground"
                  aria-label="Beschreibung bearbeiten"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDraft(item.description ?? "");
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          )
        )}
      </CardContent>
    </Card>
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
  const [tab, setTab] = useState<"alle" | ArchiveKind>("alle");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("neueste");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [selectedMilestoneImgIds, setSelectedMilestoneImgIds] = useState<Set<string>>(
    new Set()
  );
  const [downloading, setDownloading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Sync from server when initialDocuments changes
  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const items: ArchiveItem[] = useMemo(() => {
    const docItems: ArchiveItem[] = documents.map((doc) => {
      const isImage = isImageMimeType(doc.mime_type);
      const url = `${supabaseUrl}/storage/v1/object/public/vehicle-documents/${doc.storage_path}`;
      return {
        id: doc.id,
        kind: isImage ? "bild" : "dokument",
        title: doc.title,
        date: doc.document_date,
        categoryKey: doc.category,
        categoryLabel: getCategoryLabel(doc.category),
        categoryColor: CATEGORY_COLORS[doc.category],
        fileName: doc.file_name,
        fileSize: doc.file_size,
        previewUrl: isImage ? url : null,
        description: doc.description ?? null,
        canModify: canEdit && (canEditAll || doc.created_by === userId),
        document: doc,
      };
    });

    const historieItems: ArchiveItem[] = milestones.flatMap((m) =>
      m.vehicle_milestone_images.map((img) => {
        const config = CATEGORY_CONFIG[m.category as keyof typeof CATEGORY_CONFIG];
        const size = "file_size" in img ? (img.file_size as number | null) : null;
        return {
          id: img.id,
          kind: "historie" as const,
          title: m.title,
          date: m.milestone_date,
          categoryKey: m.category,
          categoryLabel: config?.label ?? m.category,
          categoryColor: config?.color ?? "bg-gray-100 text-gray-800",
          fileName: null,
          fileSize: size,
          previewUrl: `${supabaseUrl}/storage/v1/object/public/vehicle-images/${img.storage_path}`,
          description: img.caption ?? null,
          // Historie-Bilder werden in der Historie gepflegt, nicht hier.
          canModify: false,
        };
      })
    );

    return [...docItems, ...historieItems];
  }, [documents, milestones, supabaseUrl, canEdit, canEditAll, userId]);

  const counts = useMemo(
    () => ({
      alle: items.length,
      dokument: items.filter((i) => i.kind === "dokument").length,
      bild: items.filter((i) => i.kind === "bild").length,
      historie: items.filter((i) => i.kind === "historie").length,
      pdf: documents.filter((d) => d.mime_type === "application/pdf").length,
    }),
    [items, documents]
  );

  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase();

    const filtered = items.filter((item) => {
      if (tab !== "alle" && item.kind !== tab) return false;
      if (filterCategory !== "all" && item.categoryKey !== filterCategory) return false;
      if (!needle) return true;
      return [item.title, item.fileName, item.description, item.categoryLabel]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle));
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "aelteste":
          return a.date.localeCompare(b.date);
        case "titel":
          return a.title.localeCompare(b.title, "de");
        case "groesse":
          return (b.fileSize ?? 0) - (a.fileSize ?? 0);
        default:
          return b.date.localeCompare(a.date);
      }
    });
    return sorted;
  }, [items, tab, filterCategory, search, sortKey]);

  // Die Vollbildansicht blättert durch genau die Bilder, die gerade sichtbar sind.
  const visibleImages: LightboxImage[] = useMemo(
    () =>
      visibleItems
        .filter((i) => i.previewUrl)
        .map((i) => ({
          id: i.id,
          url: i.previewUrl!,
          title: i.title,
          caption: i.description,
        })),
    [visibleItems]
  );

  const refreshDocuments = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleDownload = (doc: VehicleDocument) => {
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

      const { error: storageError } = await supabase.storage
        .from("vehicle-documents")
        .remove([doc.storage_path]);
      if (storageError) throw storageError;

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

  const totalSelected = selectedDocIds.size + selectedMilestoneImgIds.size;

  const toggleSelect = (item: ArchiveItem) => {
    const setter =
      item.kind === "historie" ? setSelectedMilestoneImgIds : setSelectedDocIds;
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const isSelected = (item: ArchiveItem) =>
    item.kind === "historie"
      ? selectedMilestoneImgIds.has(item.id)
      : selectedDocIds.has(item.id);

  // Auswählen bezieht sich auf das, was gerade sichtbar ist — sonst lädt man
  // ungewollt Dateien herunter, die durch Suche oder Filter ausgeblendet sind.
  const selectAllVisible = () => {
    setSelectedDocIds(
      new Set(visibleItems.filter((i) => i.kind !== "historie").map((i) => i.id))
    );
    setSelectedMilestoneImgIds(
      new Set(visibleItems.filter((i) => i.kind === "historie").map((i) => i.id))
    );
  };

  const deselectAll = () => {
    setSelectedDocIds(new Set());
    setSelectedMilestoneImgIds(new Set());
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    deselectAll();
  };

  const handleZipDownload = async (all: boolean) => {
    setDownloading(true);
    try {
      const body = all
        ? { all: true }
        : {
            documentIds: Array.from(selectedDocIds),
            milestoneImageIds: Array.from(selectedMilestoneImgIds),
          };

      const res = await fetch(`/api/vehicles/${vehicleId}/documents-zip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Download fehlgeschlagen");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "dokumente.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (!all) exitSelectMode();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download fehlgeschlagen");
    } finally {
      setDownloading(false);
    }
  };

  const allVisibleSelected =
    visibleItems.length > 0 && totalSelected === visibleItems.length;

  const grid = (
    <>
      {visibleItems.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {counts.alle === 0
              ? "Noch keine Dokumente. Lade das erste Dokument hoch."
              : "Nichts gefunden. Passe Suche oder Filter an."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleItems.map((item) => {
            const imageIndex = visibleImages.findIndex((img) => img.id === item.id);
            return (
              <ArchiveCard
                key={`${item.kind}-${item.id}`}
                item={item}
                selectMode={selectMode}
                selected={isSelected(item)}
                onToggleSelect={() => toggleSelect(item)}
                onOpenImage={
                  imageIndex >= 0 ? () => setLightboxIndex(imageIndex) : undefined
                }
                onDownload={
                  item.document ? () => handleDownload(item.document!) : undefined
                }
                onDelete={
                  item.canModify && item.document
                    ? () => handleDelete(item.document!)
                    : undefined
                }
                onUpdateDescription={
                  item.canModify && item.document
                    ? (description) => handleUpdateDescription(item.id, description)
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      {/* Kopfzeile: Bestand links, Aktionen rechts */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {counts.alle} {counts.alle === 1 ? "Datei" : "Dateien"}
          {counts.bild + counts.historie > 0 &&
            ` · ${counts.bild + counts.historie} Bilder`}
          {counts.pdf > 0 && ` · ${counts.pdf} PDF`}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {selectMode ? (
            <>
              <Button size="sm" variant="outline" onClick={exitSelectMode}>
                <X className="h-4 w-4 mr-1.5" />
                Abbrechen
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={allVisibleSelected ? deselectAll : selectAllVisible}
              >
                {allVisibleSelected ? "Keine auswählen" : "Alle auswählen"}
              </Button>
              {totalSelected > 0 && (
                <Button
                  size="sm"
                  onClick={() => handleZipDownload(false)}
                  disabled={downloading}
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Archive className="h-4 w-4 mr-1.5" />
                  )}
                  {totalSelected} herunterladen
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleZipDownload(true)}
                disabled={downloading || counts.alle === 0}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4 mr-1.5" />
                )}
                Alle herunterladen
              </Button>
              {counts.alle > 1 && (
                <Button size="sm" variant="outline" onClick={() => setSelectMode(true)}>
                  <Check className="h-4 w-4 mr-1.5" />
                  Auswählen
                </Button>
              )}
              {canEdit && (
                <Button size="sm" onClick={() => setUploadOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Hochladen
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="w-full sm:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="alle">Alle {counts.alle}</TabsTrigger>
          <TabsTrigger value="dokument">Dokumente {counts.dokument}</TabsTrigger>
          <TabsTrigger value="bild">Bilder {counts.bild}</TabsTrigger>
          <TabsTrigger value="historie">Historie {counts.historie}</TabsTrigger>
        </TabsList>

        {/* Werkzeugleiste — wirkt auf die gerade gewählte Ansicht */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Titel, Dateiname oder Beschreibung suchen…"
              aria-label="Dokumente durchsuchen"
              className="h-9 pl-8"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-9 w-full sm:w-[190px]" aria-label="Kategorie">
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
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-9 w-full sm:w-[170px]" aria-label="Sortierung">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="neueste">Neueste zuerst</SelectItem>
              <SelectItem value="aelteste">Älteste zuerst</SelectItem>
              <SelectItem value="titel">Titel A–Z</SelectItem>
              <SelectItem value="groesse">Größe</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="alle" className="mt-4">{grid}</TabsContent>
        <TabsContent value="dokument" className="mt-4">{grid}</TabsContent>
        <TabsContent value="bild" className="mt-4">{grid}</TabsContent>
        <TabsContent value="historie" className="mt-4">{grid}</TabsContent>
      </Tabs>

      <ImageLightbox
        images={visibleImages}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />

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
