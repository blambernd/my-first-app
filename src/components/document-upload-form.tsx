"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, Upload, CalendarIcon, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/camera-capture";
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
  vehicleDocumentSchema,
  DOCUMENT_CATEGORIES,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_DOCUMENT_SIZE_MB,
  formatFileSize,
  type VehicleDocumentFormData,
} from "@/lib/validations/vehicle-document";
import type { ServiceEntry } from "@/lib/validations/service-entry";
import { getEntryTypeLabel } from "@/lib/validations/service-entry";

interface DocumentUploadFormProps {
  vehicleId: string;
  serviceEntries: ServiceEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DocumentUploadForm({
  vehicleId,
  serviceEntries,
  open,
  onOpenChange,
  onSuccess,
}: DocumentUploadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const form = useForm<VehicleDocumentFormData>({
    resolver: zodResolver(vehicleDocumentSchema) as Resolver<VehicleDocumentFormData>,
    defaultValues: {
      title: "",
      category: "sonstiges",
      document_date: new Date().toISOString().split("T")[0],
      description: "",
      service_entry_id: "none",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        category: "sonstiges",
        document_date: new Date().toISOString().split("T")[0],
        description: "",
        service_entry_id: "none",
      });
      setSelectedFile(null);
      setFileError(null);
    }
  }, [open, form]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFileError(null);
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
        setFileError(`Datei ist zu groß. Maximal ${MAX_DOCUMENT_SIZE_MB} MB.`);
        return;
      }

      setSelectedFile(file);
      // Auto-fill title from filename if empty
      if (!form.getValues("title")) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        form.setValue("title", nameWithoutExt);
      }
    },
    [form]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: MAX_DOCUMENT_SIZE_BYTES,
    multiple: false,
    onDropRejected: (rejections) => {
      const rejection = rejections[0];
      if (rejection?.errors[0]?.code === "file-too-large") {
        setFileError(`Datei ist zu groß. Maximal ${MAX_DOCUMENT_SIZE_MB} MB.`);
      } else if (rejection?.errors[0]?.code === "file-invalid-type") {
        setFileError("Nur PDF, JPG, PNG und WebP sind erlaubt.");
      }
    },
  });

  async function onSubmit(data: VehicleDocumentFormData) {
    if (!selectedFile) {
      setFileError("Bitte wähle eine Datei aus.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht eingeloggt");

      const ext = selectedFile.name.split(".").pop()?.toLowerCase() ?? "bin";
      const docId = crypto.randomUUID();
      const storagePath = `${user.id}/${vehicleId}/${docId}.${ext}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("vehicle-documents")
        .upload(storagePath, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      // Insert document record
      const { error: insertError } = await supabase
        .from("vehicle_documents")
        .insert({
          vehicle_id: vehicleId,
          title: data.title,
          category: data.category,
          document_date: data.document_date,
          description: data.description || null,
          storage_path: storagePath,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          service_entry_id: data.service_entry_id && data.service_entry_id !== "none" ? data.service_entry_id : null,
          created_by: user.id,
        });

      if (insertError) {
        // Clean up uploaded file on DB error
        await supabase.storage.from("vehicle-documents").remove([storagePath]);
        throw insertError;
      }

      toast.success("Dokument hochgeladen");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Fehler beim Hochladen. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dokument hochladen</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            {/* File dropzone */}
            {selectedFile ? (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    setSelectedFile(null);
                    setFileError(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-sm text-primary">Datei hier ablegen…</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Datei hierher ziehen oder klicken zum Auswählen
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, JPG, PNG oder WebP · Max. {MAX_DOCUMENT_SIZE_MB} MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
            {/* Camera capture with crop — mobile only */}
            {!selectedFile && (
              <CameraCapture
                enableCrop
                onCapture={(files) => {
                  const file = files[0];
                  if (!file) return;
                  setSelectedFile(file);
                  setFileError(null);
                  if (!form.getValues("title")) {
                    form.setValue("title", "Foto-Dokument");
                  }
                }}
              />
            )}

            {fileError && <p className="text-sm text-destructive">{fileError}</p>}

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titel *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Rechnung Ölwechsel März 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategorie *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategorie wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOCUMENT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="document_date"
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
                            selected={dateValue && !isNaN(dateValue.getTime()) ? dateValue : undefined}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(format(date, "yyyy-MM-dd"));
                              }
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
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optionale Beschreibung..."
                      className="min-h-[60px]"
                      maxLength={1000}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length ?? 0}/1000 Zeichen
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Link to service entry */}
            {serviceEntries.length > 0 && (
              <FormField
                control={form.control}
                name="service_entry_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mit Scheckheft-Eintrag verknüpfen</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Keine Verknüpfung" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Keine Verknüpfung</SelectItem>
                        {serviceEntries.map((entry) => (
                          <SelectItem key={entry.id} value={entry.id}>
                            {new Date(entry.service_date).toLocaleDateString("de-DE")} — {getEntryTypeLabel(entry.entry_type)}: {entry.description.slice(0, 50)}
                            {entry.description.length > 50 ? "…" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Hochladen
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
