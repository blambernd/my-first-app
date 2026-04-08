"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, CalendarIcon, Upload, X, ImageIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase";
import {
  milestoneSchema,
  MILESTONE_CATEGORIES,
  CATEGORY_CONFIG,
  type MilestoneFormData,
  type VehicleMilestoneWithImages,
} from "@/lib/validations/milestone";

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PHOTOS = 10;
const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_DOCS = 5;

interface MilestoneFormProps {
  vehicleId: string;
  supabaseUrl: string;
  milestone?: VehicleMilestoneWithImages;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface PhotoItem {
  id: string;
  file?: File;
  preview: string;
  storagePath?: string; // existing photo
}

interface DocItem {
  id: string;
  file: File;
  name: string;
}

function getImageUrl(storagePath: string, supabaseUrl: string): string {
  return `${supabaseUrl}/storage/v1/object/public/vehicle-images/${storagePath}`;
}

export function MilestoneForm({
  vehicleId,
  supabaseUrl,
  milestone,
  open,
  onOpenChange,
  onSuccess,
}: MilestoneFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [docs, setDocs] = useState<DocItem[]>([]);
  const isEditing = !!milestone;

  const form = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneSchema) as Resolver<MilestoneFormData>,
    defaultValues: {
      category: milestone?.category ?? "sonstiges",
      milestone_date:
        milestone?.milestone_date ?? new Date().toISOString().split("T")[0],
      title: milestone?.title ?? "",
      description: milestone?.description ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        category: milestone?.category ?? "sonstiges",
        milestone_date:
          milestone?.milestone_date ?? new Date().toISOString().split("T")[0],
        title: milestone?.title ?? "",
        description: milestone?.description ?? "",
      });

      // Load existing photos
      if (milestone?.vehicle_milestone_images?.length) {
        const existing: PhotoItem[] = milestone.vehicle_milestone_images
          .sort((a, b) => a.position - b.position)
          .map((img) => ({
            id: img.id,
            preview: getImageUrl(img.storage_path, supabaseUrl),
            storagePath: img.storage_path,
          }));
        setPhotos(existing);
      } else {
        setPhotos([]);
      }
      setDocs([]);
    }
  }, [open, milestone, form, supabaseUrl]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = MAX_PHOTOS - photos.length;
      const toAdd = acceptedFiles.slice(0, remaining);

      const newPhotos: PhotoItem[] = toAdd.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
      }));

      setPhotos((prev) => [...prev, ...newPhotos]);
    },
    [photos.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: MAX_PHOTO_SIZE_BYTES,
    multiple: true,
    disabled: photos.length >= MAX_PHOTOS,
    onDropRejected: (rejections) => {
      const err = rejections[0]?.errors[0];
      if (err?.code === "file-too-large") {
        toast.error("Bild ist zu groß. Maximal 5 MB pro Bild.");
      } else if (err?.code === "file-invalid-type") {
        toast.error("Nur JPG, PNG und WebP sind erlaubt.");
      }
    },
  });

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === photoId);
      if (photo && !photo.storagePath) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((p) => p.id !== photoId);
    });
  };

  const onDropDocs = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = MAX_DOCS - docs.length;
      const toAdd = acceptedFiles.slice(0, remaining);
      const newDocs: DocItem[] = toAdd.map((file) => ({
        id: crypto.randomUUID(),
        file,
        name: file.name,
      }));
      setDocs((prev) => [...prev, ...newDocs]);
    },
    [docs.length]
  );

  const {
    getRootProps: getDocRootProps,
    getInputProps: getDocInputProps,
    isDragActive: isDocDragActive,
  } = useDropzone({
    onDrop: onDropDocs,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: MAX_DOC_SIZE_BYTES,
    multiple: true,
    disabled: docs.length >= MAX_DOCS,
    onDropRejected: (rejections) => {
      const err = rejections[0]?.errors[0];
      if (err?.code === "file-too-large") {
        toast.error("Datei ist zu groß. Maximal 10 MB pro Dokument.");
      } else if (err?.code === "file-invalid-type") {
        toast.error("Nur PDF, JPG, PNG und WebP sind erlaubt.");
      }
    },
  });

  const removeDoc = (docId: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  async function onSubmit(data: MilestoneFormData) {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht eingeloggt");

      const cleanData = {
        vehicle_id: vehicleId,
        category: data.category,
        milestone_date: data.milestone_date,
        title: data.title,
        description: data.description || null,
      };

      let milestoneId: string;

      if (isEditing) {
        const { error } = await supabase
          .from("vehicle_milestones")
          .update({ ...cleanData, updated_at: new Date().toISOString() })
          .eq("id", milestone.id);
        if (error) throw error;
        milestoneId = milestone.id;

        // Delete removed photos
        const existingIds = milestone.vehicle_milestone_images?.map(
          (img) => img.id
        ) ?? [];
        const currentExistingIds = photos
          .filter((p) => p.storagePath)
          .map((p) => p.id);
        const deletedIds = existingIds.filter(
          (id) => !currentExistingIds.includes(id)
        );

        if (deletedIds.length > 0) {
          // Delete from storage
          const deletedPaths = milestone.vehicle_milestone_images
            ?.filter((img) => deletedIds.includes(img.id))
            .map((img) => img.storage_path) ?? [];
          if (deletedPaths.length > 0) {
            await supabase.storage.from("vehicle-images").remove(deletedPaths);
          }
          // Delete from DB
          await supabase
            .from("vehicle_milestone_images")
            .delete()
            .in("id", deletedIds);
        }
      } else {
        const { data: inserted, error } = await supabase
          .from("vehicle_milestones")
          .insert({ ...cleanData, created_by: user.id })
          .select("id")
          .single();
        if (error) throw error;
        milestoneId = inserted.id;
      }

      // Upload new photos
      const newPhotos = photos.filter((p) => p.file);
      const startPosition = photos.filter((p) => p.storagePath).length;

      for (let i = 0; i < newPhotos.length; i++) {
        const photo = newPhotos[i];
        const ext =
          photo.file!.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const photoId = crypto.randomUUID();
        const storagePath = `${user.id}/${vehicleId}/milestones/${photoId}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("vehicle-images")
          .upload(storagePath, photo.file!, {
            contentType: photo.file!.type,
            upsert: false,
          });
        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from("vehicle_milestone_images")
          .insert({
            milestone_id: milestoneId,
            storage_path: storagePath,
            position: startPosition + i,
          });
        if (dbError) throw dbError;
      }

      // Upload documents (linked to milestone AND visible in document archive)
      for (const doc of docs) {
        const ext = doc.file.name.split(".").pop()?.toLowerCase() ?? "pdf";
        const docId = crypto.randomUUID();
        const docStoragePath = `${user.id}/${vehicleId}/documents/${docId}.${ext}`;

        const { error: docUploadError } = await supabase.storage
          .from("vehicle-documents")
          .upload(docStoragePath, doc.file, {
            contentType: doc.file.type,
            upsert: false,
          });
        if (docUploadError) throw docUploadError;

        const { error: docDbError } = await supabase
          .from("vehicle_documents")
          .insert({
            vehicle_id: vehicleId,
            title: doc.file.name.replace(/\.[^.]+$/, ""),
            category: "sonstiges",
            document_date: data.milestone_date,
            storage_path: docStoragePath,
            file_name: doc.file.name,
            file_size: doc.file.size,
            mime_type: doc.file.type,
            milestone_id: milestoneId,
          });
        if (docDbError) throw docDbError;
      }

      toast.success(
        isEditing ? "Meilenstein aktualisiert" : "Meilenstein erstellt"
      );
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Meilenstein bearbeiten" : "Neuer Meilenstein"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 mt-4"
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Kategorie wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MILESTONE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_CONFIG[cat].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="milestone_date"
              render={({ field }) => {
                const dateValue = field.value
                  ? parse(field.value, "yyyy-MM-dd", new Date())
                  : undefined;
                return (
                  <FormItem>
                    <FormLabel>Datum *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateValue && !isNaN(dateValue.getTime())
                              ? format(dateValue, "dd.MM.yyyy")
                              : "Datum wählen"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          captionLayout="dropdown"
                          startMonth={new Date(1940, 0)}
                          endMonth={new Date()}
                          selected={
                            dateValue && !isNaN(dateValue.getTime())
                              ? dateValue
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) field.onChange(format(date, "yyyy-MM-dd"));
                          }}
                          locale={de}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Kauf bei Händler Stuttgart"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optionale Beschreibung..."
                      className="min-h-[80px]"
                      maxLength={2000}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length ?? 0}/2000 Zeichen
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Multi-photo upload */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Fotos (optional, max. {MAX_PHOTOS})
              </p>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square rounded-md overflow-hidden bg-muted"
                    >
                      <img
                        src={photo.preview}
                        alt=""
                        className="w-full h-full object-contain"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removePhoto(photo.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length < MAX_PHOTOS && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-1">
                    {isDragActive ? (
                      <Upload className="h-6 w-6 text-primary" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG oder WebP · Max. 5 MB pro Bild ·{" "}
                      {photos.length}/{MAX_PHOTOS}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Document upload */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Dokumente (optional, max. {MAX_DOCS})
              </p>
              <p className="text-xs text-muted-foreground">
                Dokumente erscheinen auch im Dokumenten-Archiv.
              </p>

              {docs.length > 0 && (
                <div className="space-y-1.5">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 rounded-md border p-2"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate flex-1">{doc.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeDoc(doc.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {docs.length < MAX_DOCS && (
                <div
                  {...getDocRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isDocDragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                >
                  <input {...getDocInputProps()} />
                  <div className="flex flex-col items-center gap-1">
                    {isDocDragActive ? (
                      <Upload className="h-6 w-6 text-primary" />
                    ) : (
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    )}
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, PNG oder WebP · Max. 10 MB · {docs.length}/{MAX_DOCS}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Speichern" : "Meilenstein erstellen"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
