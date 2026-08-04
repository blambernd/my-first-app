"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, CalendarIcon, AlertTriangle } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { eurToCents, formatCentsToEur } from "@/lib/validations/service-entry";
import {
  fuelEntrySchema,
  FUEL_TYPES,
  formatKm,
  pricePerLiterCents,
  type FuelEntryFormData,
  type FuelEntry,
} from "@/lib/validations/fuel-entry";

// Radix Select erlaubt keinen leeren Item-Wert. Dieser Platzhalter steht für
// "keine Angabe" und wird beim Speichern wieder zu undefined.
const NO_FUEL_TYPE = "__keine__";

interface FuelEntryFormProps {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  /** Vorhandener Eintrag — gesetzt beim Bearbeiten */
  entry?: FuelEntry;
  /** km-Stand des chronologisch vorherigen Tankvorgangs, für die Plausibilitätswarnung */
  previousMileageKm?: number | null;
  /** km-Stand aus dem Fahrzeugprofil, für das Übernahme-Angebot */
  vehicleMileageKm?: number | null;
}

export function FuelEntryForm({
  vehicleId,
  open,
  onOpenChange,
  onSaved,
  entry,
  previousMileageKm,
  vehicleMileageKm,
}: FuelEntryFormProps) {
  const isEditing = Boolean(entry);
  const [saving, setSaving] = useState(false);
  const [updateVehicleMileage, setUpdateVehicleMileage] = useState(true);
  const supabase = createClient();

  const form = useForm<FuelEntryFormData>({
    resolver: zodResolver(fuelEntrySchema) as Resolver<FuelEntryFormData>,
    defaultValues: {
      fueled_at: format(new Date(), "yyyy-MM-dd"),
      liters: undefined as unknown as number,
      cost_eur: undefined as unknown as number,
      mileage_km: undefined as unknown as number,
      is_full_tank: true,
      is_odometer_correction: false,
      station: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (entry) {
      form.reset({
        fueled_at: entry.fueled_at,
        liters: entry.liters,
        // Beim Bearbeiten eines Eintrags, dessen Betrag beim Besitzerwechsel
        // geleert wurde (PROJ-32), bleibt das Feld leer statt 0 zu zeigen —
        // sonst trüge der neue Besitzer unbemerkt eine Null ein.
        cost_eur:
          entry.cost_cents === null ? undefined : entry.cost_cents / 100,
        mileage_km: entry.mileage_km,
        is_full_tank: entry.is_full_tank,
        is_odometer_correction: entry.is_odometer_correction,
        station: entry.station ?? "",
        fuel_type: entry.fuel_type ?? undefined,
        notes: entry.notes ?? "",
      });
    } else {
      form.reset({
        fueled_at: format(new Date(), "yyyy-MM-dd"),
        liters: undefined as unknown as number,
        cost_eur: undefined as unknown as number,
        mileage_km: undefined as unknown as number,
        is_full_tank: true,
        is_odometer_correction: false,
        station: "",
        notes: "",
      });
    }
    setUpdateVehicleMileage(true);
  }, [open, entry, form]);

  const liters = form.watch("liters");
  const costEur = form.watch("cost_eur");
  const mileageKm = form.watch("mileage_km");
  const isOdometerCorrection = form.watch("is_odometer_correction");

  const perLiter =
    liters > 0 && costEur >= 0
      ? pricePerLiterCents(eurToCents(costEur), liters)
      : null;

  // Ein sinkender Kilometerstand deutet auf einen Tippfehler hin — außer der Nutzer
  // hat den Eintrag ausdrücklich als Tacho-Korrektur markiert.
  const mileageLooksWrong =
    !isOdometerCorrection &&
    previousMileageKm != null &&
    Number.isFinite(mileageKm) &&
    mileageKm > 0 &&
    mileageKm < previousMileageKm;

  const canOfferMileageUpdate =
    !isEditing &&
    !isOdometerCorrection &&
    vehicleMileageKm != null &&
    Number.isFinite(mileageKm) &&
    mileageKm > vehicleMileageKm;

  async function onSubmit(data: FuelEntryFormData) {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const payload = {
        vehicle_id: vehicleId,
        fueled_at: data.fueled_at,
        liters: data.liters,
        cost_cents: eurToCents(data.cost_eur),
        mileage_km: data.mileage_km,
        is_full_tank: data.is_full_tank,
        is_odometer_correction: data.is_odometer_correction,
        station: data.station || null,
        fuel_type: data.fuel_type ?? null,
        notes: data.notes || null,
      };

      if (isEditing && entry) {
        const { error } = await supabase
          .from("fuel_entries")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", entry.id);
        if (error) throw error;
        toast.success("Tankvorgang aktualisiert");
      } else {
        const { error } = await supabase
          .from("fuel_entries")
          .insert({ ...payload, created_by: user.id });
        if (error) throw error;
        toast.success("Tankvorgang erfasst");
      }

      if (canOfferMileageUpdate && updateVehicleMileage) {
        const { error: vehicleError } = await supabase
          .from("vehicles")
          .update({
            mileage_km: data.mileage_km,
            mileage_date: data.fueled_at,
          })
          .eq("id", vehicleId);
        // Der Tankvorgang ist bereits gespeichert — ein Fehler hier darf ihn nicht
        // entwerten, deshalb nur ein Hinweis statt eines Abbruchs.
        if (vehicleError) {
          toast.warning("Kilometerstand im Fahrzeugprofil konnte nicht aktualisiert werden");
        }
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error("Tankvorgang konnte nicht gespeichert werden:", error);
      toast.error(
        error instanceof Error ? error.message : "Speichern fehlgeschlagen"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Tankvorgang bearbeiten" : "Tankvorgang erfassen"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fueled_at"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Datum</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(
                                parse(field.value, "yyyy-MM-dd", new Date()),
                                "dd.MM.yyyy",
                                { locale: de }
                              )
                            : "Datum wählen"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        locale={de}
                        selected={
                          field.value
                            ? parse(field.value, "yyyy-MM-dd", new Date())
                            : undefined
                        }
                        onSelect={(date) =>
                          date && field.onChange(format(date, "yyyy-MM-dd"))
                        }
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="liters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liter</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min="0"
                        placeholder="42,5"
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
                name="cost_eur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gesamtpreis (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="89,90"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {perLiter !== null && (
              <p className="text-sm text-muted-foreground">
                Preis pro Liter: {formatCentsToEur(perLiter)}
              </p>
            )}

            <FormField
              control={form.control}
              name="mileage_km"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kilometerstand</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      step="1"
                      min="0"
                      placeholder="89000"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  {previousMileageKm != null && (
                    <FormDescription>
                      Vorheriger Tankvorgang: {formatKm(previousMileageKm)} km
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {mileageLooksWrong && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Der Kilometerstand liegt unter dem des vorherigen Tankvorgangs.
                  Prüfe die Eingabe — oder markiere den Eintrag als Tacho-Korrektur,
                  wenn der Tacho gewechselt oder zurückgesetzt wurde. Für diesen
                  Abschnitt wird kein Verbrauch berechnet.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="is_full_tank"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5 pr-4">
                    <FormLabel>Volltankung</FormLabel>
                    <FormDescription>
                      Der Verbrauch wird nur zwischen zwei Volltankungen berechnet.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_odometer_correction"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5 pr-4">
                    <FormLabel>Tacho-Korrektur</FormLabel>
                    <FormDescription>
                      Bei Tachowechsel oder -rücksetzung. Die Verbrauchsberechnung
                      wird an dieser Stelle unterbrochen.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {canOfferMileageUpdate && (
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Checkbox
                  id="update-vehicle-mileage"
                  checked={updateVehicleMileage}
                  onCheckedChange={(checked) =>
                    setUpdateVehicleMileage(checked === true)
                  }
                  className="mt-0.5"
                />
                <label
                  htmlFor="update-vehicle-mileage"
                  className="text-sm leading-snug"
                >
                  Kilometerstand im Fahrzeugprofil auf{" "}
                  <strong>{formatKm(mileageKm)} km</strong> aktualisieren
                  <span className="block text-muted-foreground">
                    Bisher hinterlegt: {formatKm(vehicleMileageKm!)} km
                  </span>
                </label>
              </div>
            )}

            <FormField
              control={form.control}
              name="fuel_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kraftstoffsorte (optional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(
                        value === NO_FUEL_TYPE ? undefined : value
                      )
                    }
                    value={field.value ?? NO_FUEL_TYPE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Keine Angabe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_FUEL_TYPE}>Keine Angabe</SelectItem>
                      {FUEL_TYPES.map((type) => (
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

            <FormField
              control={form.control}
              name="station"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tankstelle (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="z. B. Aral Hauptstraße" {...field} />
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
                  <FormLabel>Notiz (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Speichern" : "Erfassen"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
