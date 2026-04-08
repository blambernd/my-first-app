"use client";

import { useState, useCallback, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  rechnung: "bg-blue-100 text-blue-800",
  gutachten: "bg-emerald-100 text-emerald-800",
  tuev_bericht: "bg-green-100 text-green-800",
  kaufvertrag: "bg-violet-100 text-violet-800",
  versicherung: "bg-orange-100 text-orange-800",
  zulassung: "bg-cyan-100 text-cyan-800",
  sonstiges: "bg-gray-100 text-gray-800",
};

interface DocumentArchiveProps {
  vehicleId: string;
  initialDocuments: VehicleDocument[];
  serviceEntries: ServiceEntry[];
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

export function DocumentArchive({
  vehicleId,
  initialDocuments,
  serviceEntries,
  supabaseUrl,
  canEdit = true,
  canEditAll = true,
  userId,
}: DocumentArchiveProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<VehicleDocument[]>(initialDocuments);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [uploadOpen, setUploadOpen] = useState(false);

  const filteredDocuments =
    filterCategory === "all"
      ? documents
      : documents.filter((d) => d.category === filterCategory);

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

      toast.success("Dokument gelöscht");
      refreshDocuments();
    } catch {
      toast.error("Fehler beim Löschen");
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
                {documents.filter((d) => isImageMimeType(d.mime_type)).length}
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

      {/* Filter + Upload button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
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
        {canEdit && (
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Hochladen
          </Button>
        )}
      </div>

      {/* Document grid */}
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
