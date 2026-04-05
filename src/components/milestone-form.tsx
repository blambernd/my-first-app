"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, CalendarIcon, Upload, X, ImageIcon } from "lucide-react";
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
  type MilestoneFormData,
  type VehicleMilestone,
} from "@/lib/validations/milestone";

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface MilestoneFormProps {
  vehicleId: string;
  milestone?: VehicleMilestone;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MilestoneForm({
  vehicleId,
  milestone,
  open,
  onOpenChange,
  onSuccess,
}: MilestoneFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const isEditing = !!milestone;

  const form = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneSchema) as Resolver<MilestoneFormData>,
    defaultValues: {
      milestone_date: milestone?.milestone_date ?? new Date().toISOString().split("T")[0],
      title: milestone?.title ?? "",
      description: milestone?.description ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        milestone_date: milestone?.milestone_date ?? new Date().toISOString().split("T")[0],
        title: milestone?.title ?? "",
        description: milestone?.description ?? "",
      });
      setSelectedPhoto(null);
      setPhotoPreview(null);
    }
  }, [open, milestone, form]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setSelectedPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: MAX_PHOTO_SIZE_BYTES,
    multiple: false,
    onDropRejected: (rejections) => {
      const err = rejections[0]?.errors[0];
      if (err?.code === "file-too-large") {
        toast.error("Bild ist zu groß. Maximal 5 MB.");
      } else if (err?.code === "file-invalid-type") {
        toast.error("Nur JPG, PNG und WebP sind erlaubt.");
      }
    },
  });

  async function onSubmit(data: MilestoneFormData) {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht eingeloggt");

      let photoPath: string | null = milestone?.photo_path ?? null;

      // Upload photo if selected
      if (selectedPhoto) {
        const ext = selectedPhoto.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const photoId = crypto.randomUUID();
        photoPath = `${user.id}/${vehicleId}/milestones/${photoId}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("vehicle-images")
          .upload(photoPath, selectedPhoto, {
            contentType: selectedPhoto.type,
            upsert: false,
          });
        if (uploadError) throw uploadError;
      }

      const cleanData = {
        vehicle_id: vehicleId,
        milestone_date: data.milestone_date,
        title: data.title,
        description: data.description || null,
        photo_path: photoPath,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("vehicle_milestones")
          .update({ ...cleanData, updated_at: new Date().toISOString() })
          .eq("id", milestone.id);
        if (error) throw error;
        toast.success("Meilenstein aktualisiert");
      } else {
        const { error } = await supabase
          .from("vehicle_milestones")
          .insert(cleanData);
        if (error) throw error;
        toast.success("Meilenstein erstellt");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Meilenstein bearbeiten" : "Neuer Meilenstein"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
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
                          selected={dateValue && !isNaN(dateValue.getTime()) ? dateValue : undefined}
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
                    <Input placeholder="z.B. Kauf, Erstzulassung, Lackierung" {...field} />
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

            {/* Photo upload */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Foto (optional)</p>
              {photoPreview || (isEditing && milestone?.photo_path) ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={photoPreview ?? ""}
                    alt="Vorschau"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={() => {
                      setSelectedPhoto(null);
                      if (photoPreview) URL.revokeObjectURL(photoPreview);
                      setPhotoPreview(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
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
                      JPG, PNG oder WebP · Max. 5 MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
