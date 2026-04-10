"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, CalendarIcon, Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  serviceEntrySchema,
  SERVICE_ENTRY_TYPES,
  OIL_CHANGE_CATEGORIES,
  eurToCents,
  getEntryTypeLabel,
  type ServiceEntryFormData,
  type ServiceEntry,
  type OilChangeCategoryEntry,
  type OilChangeCategory,
} from "@/lib/validations/service-entry";
import {
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
} from "@/lib/validations/vehicle-document";

interface ServiceEntryFormProps {
  vehicleId: string;
  entry?: ServiceEntry;
  lastMileage?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ServiceEntryForm({
  vehicleId,
  entry,
  lastMileage,
  open,
  onOpenChange,
  onSuccess,
}: ServiceEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOdometerWarning, setShowOdometerWarning] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentCategory, setDocumentCategory] = useState<DocumentCategory>("rechnung");
  const [oilCategories, setOilCategories] = useState<OilChangeCategoryEntry[]>(
    entry?.oil_change_categories ?? []
  );
  const [otherOilLabel, setOtherOilLabel] = useState(
    entry?.oil_change_categories?.find((c) => c.category === "other_oil")?.custom_label ?? ""
  );
  const isEditing = !!entry;

  const onDocumentDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Dokument darf maximal 10 MB groß sein.");
      return;
    }
    setDocumentFile(file);
  }, []);

  const {
    getRootProps: getDocRootProps,
    getInputProps: getDocInputProps,
    isDragActive: isDocDragActive,
  } = useDropzone({
    onDrop: onDocumentDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const form = useForm<ServiceEntryFormData>({
    resolver: zodResolver(serviceEntrySchema) as Resolver<ServiceEntryFormData>,
    defaultValues: {
      service_date: entry?.service_date ?? new Date().toISOString().split("T")[0],
      entry_type: entry?.entry_type ?? "inspection",
      description: entry?.description ?? "",
      mileage_km: entry?.mileage_km ?? ("" as unknown as number),
      is_odometer_correction: entry?.is_odometer_correction ?? false,
      cost_cents: entry?.cost_cents ? entry.cost_cents / 100 : undefined,
      workshop_name: entry?.workshop_name ?? "",
      notes: entry?.notes ?? "",
      next_due_date: entry?.next_due_date ?? "",
    },
  });

  // Reset form when entry changes (open for edit vs new)
  useEffect(() => {
    if (open) {
      form.reset({
        service_date: entry?.service_date ?? new Date().toISOString().split("T")[0],
        entry_type: entry?.entry_type ?? "inspection",
        description: entry?.description ?? "",
        mileage_km: entry?.mileage_km ?? ("" as unknown as number),
        is_odometer_correction: entry?.is_odometer_correction ?? false,
        cost_cents: entry?.cost_cents ? entry.cost_cents / 100 : undefined,
        workshop_name: entry?.workshop_name ?? "",
        notes: entry?.notes ?? "",
        next_due_date: entry?.next_due_date ?? "",
      });
      setShowOdometerWarning(false);
      setDocumentFile(null);
      setDocumentCategory("rechnung");
      setOilCategories(entry?.oil_change_categories ?? []);
      setOtherOilLabel(
        entry?.oil_change_categories?.find((c) => c.category === "other_oil")?.custom_label ?? ""
      );
    }
  }, [open, entry, form]);

  const watchMileage = form.watch("mileage_km");
  const watchOdometerCorrection = form.watch("is_odometer_correction");
  const watchEntryType = form.watch("entry_type");

  useEffect(() => {
    if (
      lastMileage !== undefined &&
      typeof watchMileage === "number" &&
      watchMileage > 0 &&
      watchMileage < lastMileage &&
      !watchOdometerCorrection
    ) {
      setShowOdometerWarning(true);
    } else {
      setShowOdometerWarning(false);
    }
  }, [watchMileage, lastMileage, watchOdometerCorrection]);

  // Clear next_due_date for oil_change entries (km is stored per subcategory now)
  useEffect(() => {
    if (watchEntryType === "oil_change") {
      form.setValue("next_due_date", "");
    }
  }, [watchEntryType, form]);

  async function onSubmit(data: ServiceEntryFormData) {
    if (isSubmitting) return;
    if (showOdometerWarning && !data.is_odometer_correction) {
      toast.error("Bitte bestätige die Tacho-Korrektur oder korrigiere den Kilometerstand.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht eingeloggt");

      // Prepare oil change categories with custom label
      const finalOilCategories = data.entry_type === "oil_change" && oilCategories.length > 0
        ? oilCategories.map((cat) => ({
            ...cat,
            custom_label: cat.category === "other_oil" ? otherOilLabel || undefined : undefined,
          }))
        : null;

      const cleanData = {
        vehicle_id: vehicleId,
        service_date: data.service_date,
        entry_type: data.entry_type,
        description: data.description,
        mileage_km: data.mileage_km,
        is_odometer_correction: data.is_odometer_correction,
        cost_cents: data.cost_cents ? eurToCents(data.cost_cents) : null,
        workshop_name: data.workshop_name || null,
        notes: data.notes || null,
        next_due_date: data.next_due_date || null,
        oil_change_categories: finalOilCategories,
      };

      let entryId: string;

      if (isEditing) {
        const { error } = await supabase
          .from("service_entries")
          .update({ ...cleanData, updated_at: new Date().toISOString() })
          .eq("id", entry.id);
        if (error) throw error;
        entryId = entry.id;
        toast.success("Eintrag aktualisiert");
      } else {
        const { data: inserted, error } = await supabase
          .from("service_entries")
          .insert({ ...cleanData, created_by: user.id })
          .select("id")
          .single();
        if (error || !inserted) throw error ?? new Error("Eintrag konnte nicht erstellt werden");
        entryId = inserted.id;
        toast.success("Eintrag erstellt");
      }

      // Upload document and link to Dokumenten-Archiv
      if (documentFile) {
        try {
          const ext = documentFile.name.split(".").pop()?.toLowerCase() ?? "bin";
          const docId = crypto.randomUUID();
          const storagePath = `${user.id}/${vehicleId}/${docId}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("vehicle-documents")
            .upload(storagePath, documentFile, {
              contentType: documentFile.type,
              upsert: false,
            });
          if (uploadError) throw uploadError;

          const { error: insertError } = await supabase
            .from("vehicle_documents")
            .insert({
              vehicle_id: vehicleId,
              title: `${getEntryTypeLabel(data.entry_type)} — ${data.description.slice(0, 80)}`,
              category: documentCategory,
              document_date: data.service_date,
              description: data.description,
              storage_path: storagePath,
              file_name: documentFile.name,
              file_size: documentFile.size,
              mime_type: documentFile.type,
              service_entry_id: entryId,
              created_by: user.id,
            });
          if (insertError) throw insertError;
        } catch (docError) {
          console.error("Document upload error:", docError);
          toast.error("Eintrag erstellt, aber Dokument konnte nicht gespeichert werden.");
        }
      }

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
    <Dialog open={open} onOpenChange={(v) => { if (!isSubmitting) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto sm:overflow-y-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Eintrag bearbeiten" : "Neuer Scheckheft-Eintrag"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="service_date"
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
              <FormField
                control={form.control}
                name="entry_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Typ wählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SERVICE_ENTRY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Oil change subcategories */}
            {watchEntryType === "oil_change" && (
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-medium">Ölkategorien</p>
                <p className="text-xs text-muted-foreground">
                  Wähle die Ölarten aus und gib jeweils den Kilometerstand für den nächsten Wechsel an.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {OIL_CHANGE_CATEGORIES.map((cat) => {
                    const isSelected = oilCategories.some((c) => c.category === cat.value);
                    const catEntry = oilCategories.find((c) => c.category === cat.value);
                    return (
                      <div key={cat.value} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setOilCategories((prev) => [
                                  ...prev,
                                  { category: cat.value as OilChangeCategory, next_due_km: null },
                                ]);
                              } else {
                                setOilCategories((prev) =>
                                  prev.filter((c) => c.category !== cat.value)
                                );
                              }
                            }}
                          />
                          <span className="text-sm">{cat.label}</span>
                        </div>
                        {isSelected && cat.value === "other_oil" && (
                          <Input
                            placeholder="Bezeichnung..."
                            value={otherOilLabel}
                            onChange={(e) => setOtherOilLabel(e.target.value)}
                            className="h-7 text-xs"
                          />
                        )}
                        {isSelected && (
                          <Input
                            type="number"
                            placeholder="km z.B. 95000"
                            value={catEntry?.next_due_km ?? ""}
                            onChange={(e) => {
                              const val = e.target.value ? parseInt(e.target.value, 10) : null;
                              setOilCategories((prev) =>
                                prev.map((c) =>
                                  c.category === cat.value
                                    ? { ...c, next_due_km: val }
                                    : c
                                )
                              );
                            }}
                            className="h-7 text-xs"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Was wurde gemacht?"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mileage_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kilometerstand *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="z.B. 85000"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kosten (EUR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="z.B. 149,90"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {showOdometerWarning && (
              <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 space-y-2">
                <p className="text-sm text-yellow-800">
                  Der Kilometerstand ({watchMileage?.toLocaleString("de-DE")} km) ist niedriger als der letzte Eintrag ({lastMileage?.toLocaleString("de-DE")} km).
                </p>
                <FormField
                  control={form.control}
                  name="is_odometer_correction"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0 text-sm text-yellow-800">
                        Dies ist eine Tacho-Korrektur
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="workshop_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Werkstatt</FormLabel>
                  <FormControl>
                    <Input placeholder="Name der Werkstatt" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notizen</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Weitere Anmerkungen..."
                      className="min-h-[60px]"
                      maxLength={2000}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hide "Nächster Termin" for oil_change — km is stored per subcategory */}
            {watchEntryType !== "oil_change" && (
              <FormField
                control={form.control}
                name="next_due_date"
                render={({ field }) => {
                  const dateValue = field.value
                    ? parse(field.value, "yyyy-MM-dd", new Date())
                    : undefined;
                  return (
                    <FormItem>
                      <FormLabel>Nächster Termin</FormLabel>
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
                                : "Termin wählen (optional)"}
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
                      <FormDescription>
                        Wann steht der nächste Termin an?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            )}

            {/* Dokument anhängen */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Dokument anhängen</p>
              <p className="text-xs text-muted-foreground">
                Wird automatisch im Dokumenten-Archiv gespeichert.
              </p>
              {documentFile ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{documentFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(documentFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setDocumentFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Kategorie</p>
                    <Select value={documentCategory} onValueChange={(v) => setDocumentCategory(v as DocumentCategory)}>
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
                  </div>
                </div>
              ) : (
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
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, PNG oder WebP · Max. 10 MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Speichern" : "Eintrag erstellen"}
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
