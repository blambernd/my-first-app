"use client";

import { useState, useCallback } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, FileText, X, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ImageUpload, type ImageFile } from "@/components/image-upload";
import { createClient } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  vehicleSchema,
  VEHICLE_MAKES,
  BODY_TYPES,
  type VehicleFormData,
  type Vehicle,
  type VehicleImage,
} from "@/lib/validations/vehicle";

interface VehicleFormProps {
  vehicle?: Vehicle;
  vehicleImages?: VehicleImage[];
  mode: "create" | "edit";
}

export function VehicleForm({ vehicle, vehicleImages = [], mode }: VehicleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [makeOpen, setMakeOpen] = useState(false);
  const [newImages, setNewImages] = useState<ImageFile[]>([]);
  const [datenkarte, setDatekarte] = useState<File | null>(null);
  const [datenkartePreview, setDatenkartePreview] = useState<string | null>(null);

  const onDatenkarteDropped = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Datenkarte darf maximal 10 MB groß sein.");
      return;
    }
    setDatekarte(file);
    if (file.type.startsWith("image/")) {
      setDatenkartePreview(URL.createObjectURL(file));
    } else {
      setDatenkartePreview(null);
    }
  }, []);

  const {
    getRootProps: getDatenkarteRootProps,
    getInputProps: getDatenkarteInputProps,
    isDragActive: isDatenkarteActive,
  } = useDropzone({
    onDrop: onDatenkarteDropped,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const removeDatekarte = () => {
    if (datenkartePreview) URL.revokeObjectURL(datenkartePreview);
    setDatekarte(null);
    setDatenkartePreview(null);
  };
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(() => {
    if (!vehicleImages.length) return [];
    const supabase = createClient();
    return vehicleImages.map((img) => {
      const { data } = supabase.storage
        .from("vehicle-images")
        .getPublicUrl(img.storage_path);
      return data.publicUrl;
    });
  });
  const [removedImagePaths, setRemovedImagePaths] = useState<string[]>([]);

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema) as Resolver<VehicleFormData>,
    defaultValues: {
      make: vehicle?.make ?? "",
      model: vehicle?.model ?? "",
      year: vehicle?.year ?? ("" as unknown as number),
      year_estimated: vehicle?.year_estimated ?? false,
      vin: vehicle?.vin ?? "",
      license_plate: vehicle?.license_plate ?? "",
      body_type: vehicle?.body_type ?? "",
      factory_code: vehicle?.factory_code ?? "",
      color: vehicle?.color ?? "",
      engine_type: vehicle?.engine_type ?? "",
      displacement_ccm: vehicle?.displacement_ccm ?? undefined,
      horsepower: vehicle?.horsepower ?? undefined,
      mileage_km: vehicle?.mileage_km ?? undefined,
    },
  });

  const handleExistingImageRemove = (url: string) => {
    const index = existingImageUrls.indexOf(url);
    if (index !== -1 && vehicleImages[index]) {
      setRemovedImagePaths((prev) => [...prev, vehicleImages[index].storage_path]);
    }
    setExistingImageUrls((prev) => prev.filter((u) => u !== url));
  };

  async function onSubmit(data: VehicleFormData) {
    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // Refresh session to ensure a valid JWT is sent to the database
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        toast.error("Sitzung abgelaufen. Bitte melde dich erneut an.");
        router.push("/login");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Du bist nicht angemeldet.");
        router.push("/login");
        return;
      }

      const cleanData = {
        make: data.make,
        model: data.model,
        year: data.year,
        year_estimated: data.year_estimated,
        vin: data.vin || null,
        license_plate: data.license_plate || null,
        body_type: data.body_type || null,
        factory_code: data.factory_code || null,
        color: data.color || null,
        engine_type: data.engine_type || null,
        displacement_ccm: data.displacement_ccm || null,
        horsepower: data.horsepower || null,
        mileage_km: data.mileage_km ?? null,
      };

      let vehicleId: string;

      if (mode === "create") {
        // Step 1: Insert vehicle (without .select() to avoid SELECT RLS issues)
        const insertPayload = { ...cleanData, user_id: user.id };
        const { error: insertError } = await supabase
          .from("vehicles")
          .insert(insertPayload);

        if (insertError) throw insertError;

        // Step 2: Fetch the newly created vehicle separately
        const { data: newVehicle, error: selectError } = await supabase
          .from("vehicles")
          .select("id")
          .eq("user_id", user.id)
          .eq("make", data.make)
          .eq("model", data.model)
          .eq("year", data.year)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (selectError || !newVehicle) throw selectError ?? new Error("Fahrzeug konnte nicht gefunden werden");
        vehicleId = newVehicle.id;
      } else {
        if (!vehicle) throw new Error("Fahrzeug nicht gefunden");
        const { error } = await supabase
          .from("vehicles")
          .update({ ...cleanData, updated_at: new Date().toISOString() })
          .eq("id", vehicle.id);

        if (error) throw error;
        vehicleId = vehicle.id;

        // Remove deleted images
        for (const path of removedImagePaths) {
          await supabase.storage.from("vehicle-images").remove([path]);
          await supabase
            .from("vehicle_images")
            .delete()
            .eq("vehicle_id", vehicleId)
            .eq("storage_path", path);
        }
      }

      // Upload new images
      const startPosition = existingImageUrls.length;
      for (let i = 0; i < newImages.length; i++) {
        const image = newImages[i];
        const fileExt = image.file.name.split(".").pop();
        const filePath = `${user.id}/${vehicleId}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("vehicle-images")
          .upload(filePath, image.file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Fehler beim Hochladen von "${image.file.name}"`);
          continue;
        }

        await supabase.from("vehicle_images").insert({
          vehicle_id: vehicleId,
          storage_path: filePath,
          position: startPosition + i,
          is_primary: startPosition === 0 && i === 0,
        });
      }

      // Upload Datenkarte and create Erstzulassung milestone
      if (datenkarte) {
        try {
          const datenkarteExt =
            datenkarte.name.split(".").pop()?.toLowerCase() ?? "jpg";
          const datenkarteId = crypto.randomUUID();
          const datenkartePath = `${user.id}/${vehicleId}/milestones/${datenkarteId}.${datenkarteExt}`;

          const { error: dkUploadError } = await supabase.storage
            .from("vehicle-images")
            .upload(datenkartePath, datenkarte, {
              contentType: datenkarte.type,
              upsert: false,
            });
          if (dkUploadError) throw dkUploadError;

          // Create milestone with approximate delivery date (Jan 1 of build year)
          const deliveryDate = `${data.year}-01-01`;
          const { data: milestone, error: msError } = await supabase
            .from("vehicle_milestones")
            .insert({
              vehicle_id: vehicleId,
              category: "erstzulassung",
              milestone_date: deliveryDate,
              title: "Auslieferung / Erstzulassung",
              description: "Datenkarte zum Auslieferungszustand hinterlegt.",
              created_by: user.id,
            })
            .select("id")
            .single();
          if (msError) throw msError;

          // Link Datenkarte as milestone image
          await supabase.from("vehicle_milestone_images").insert({
            milestone_id: milestone.id,
            storage_path: datenkartePath,
            position: 0,
          });

          // Also save as document with "datenkarte" category
          const docPath = `${user.id}/${vehicleId}/documents/${datenkarteId}.${datenkarteExt}`;
          const { error: docUploadError } = await supabase.storage
            .from("vehicle-documents")
            .upload(docPath, datenkarte, {
              contentType: datenkarte.type,
              upsert: false,
            });
          if (!docUploadError) {
            await supabase.from("vehicle_documents").insert({
              vehicle_id: vehicleId,
              title: "Datenkarte",
              category: "datenkarte",
              document_date: deliveryDate,
              storage_path: docPath,
              file_name: datenkarte.name,
              file_size: datenkarte.size,
              mime_type: datenkarte.type,
              milestone_id: milestone.id,
              created_by: user.id,
            });
          }
        } catch (dkError) {
          console.error("Datenkarte error:", dkError);
          toast.error("Datenkarte konnte nicht gespeichert werden.");
        }
      }

      toast.success(
        mode === "create"
          ? "Fahrzeug erfolgreich angelegt!"
          : "Fahrzeug erfolgreich aktualisiert!"
      );
      router.push(`/vehicles/${vehicleId}`);
      router.refresh();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Pflichtfelder */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Stammdaten</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="make"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Hersteller *</FormLabel>
                  <Popover open={makeOpen} onOpenChange={setMakeOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={makeOpen}
                          className={cn(
                            "w-full justify-between font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "Hersteller wählen"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Hersteller suchen..." />
                        <CommandList>
                          <CommandEmpty>Kein Hersteller gefunden.</CommandEmpty>
                          <CommandGroup>
                            {VEHICLE_MAKES.map((make) => (
                              <CommandItem
                                key={make}
                                value={make}
                                onSelect={() => {
                                  field.onChange(make);
                                  setMakeOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === make ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {make}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modell *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. 300 SL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="body_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fahrzeugform</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bitte wählen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BODY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name="factory_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Werksbezeichnung</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. W123, E30, 911 G-Modell" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Baujahr *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="z.B. 1955"
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
              name="year_estimated"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 pt-8">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Baujahr geschätzt</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Optionale Felder */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Weitere Details</h3>
          <p className="text-sm text-muted-foreground">Alle Felder optional</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="vin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>FIN (Fahrgestellnummer)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="17-stellig, z.B. WDB1980361A123456"
                      maxLength={17}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>17 Zeichen alphanumerisch</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="license_plate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kennzeichen</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. S-OL 1955H" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Farbe</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Silber Metallic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="engine_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motortyp</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Reihen-6-Zylinder Benziner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displacement_ccm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hubraum (ccm)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="z.B. 2996"
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
              name="horsepower"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leistung (PS)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="z.B. 215"
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
              name="mileage_km"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Laufleistung (km)</FormLabel>
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
          </div>
        </div>

        {/* Bildupload */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Fotos</h3>
          <ImageUpload
            images={newImages}
            onImagesChange={setNewImages}
            existingImageUrls={existingImageUrls}
            onExistingImageRemove={mode === "edit" ? handleExistingImageRemove : undefined}
          />
        </div>

        {/* Datenkarte */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Datenkarte</h3>
            <p className="text-sm text-muted-foreground">
              Die Datenkarte dokumentiert den Auslieferungszustand des Fahrzeugs.
              Bei Upload wird automatisch ein Meilenstein in der Historie erstellt.
            </p>

            {datenkarte ? (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                {datenkartePreview ? (
                  <img
                    src={datenkartePreview}
                    alt="Datenkarte Vorschau"
                    className="h-16 w-16 rounded object-contain bg-muted"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {datenkarte.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(datenkarte.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={removeDatekarte}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                {...getDatenkarteRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDatenkarteActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getDatenkarteInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Datenkarte hierher ziehen oder klicken
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, WebP oder PDF · Max. 10 MB
                  </p>
                </div>
              </div>
            )}
          </div>

        {/* Aktionen */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Fahrzeug anlegen" : "Änderungen speichern"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
        </div>
      </form>
    </Form>
  );
}
