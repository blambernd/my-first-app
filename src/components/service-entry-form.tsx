"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, CalendarIcon } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase";
import {
  serviceEntrySchema,
  SERVICE_ENTRY_TYPES,
  eurToCents,
  type ServiceEntryFormData,
  type ServiceEntry,
} from "@/lib/validations/service-entry";

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
  const isEditing = !!entry;

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
      });
      setShowOdometerWarning(false);
    }
  }, [open, entry, form]);

  const watchMileage = form.watch("mileage_km");
  const watchOdometerCorrection = form.watch("is_odometer_correction");

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

  async function onSubmit(data: ServiceEntryFormData) {
    if (showOdometerWarning && !data.is_odometer_correction) {
      toast.error("Bitte bestätige die Tacho-Korrektur oder korrigiere den Kilometerstand.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht eingeloggt");

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
      };

      if (isEditing) {
        const { error } = await supabase
          .from("service_entries")
          .update({ ...cleanData, updated_at: new Date().toISOString() })
          .eq("id", entry.id);
        if (error) throw error;
        toast.success("Eintrag aktualisiert");
      } else {
        const { error } = await supabase
          .from("service_entries")
          .insert({ ...cleanData, created_by: user.id });
        if (error) throw error;
        toast.success("Eintrag erstellt");
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Eintrag bearbeiten" : "Neuer Scheckheft-Eintrag"}
          </SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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
      </SheetContent>
    </Sheet>
  );
}
