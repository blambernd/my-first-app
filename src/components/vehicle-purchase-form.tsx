"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, CalendarIcon, Plus, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
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
import { eurToCents } from "@/lib/validations/service-entry";
import {
  vehiclePurchaseSchema,
  type VehiclePurchaseFormData,
  type VehiclePurchaseWithCosts,
} from "@/lib/validations/vehicle-purchase";

interface VehiclePurchaseFormProps {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase?: VehiclePurchaseWithCosts | null;
  /** Datum eines vorhandenen Kauf-Meilensteins als Vorbelegung */
  milestoneDate?: string | null;
}

export function VehiclePurchaseForm({
  vehicleId,
  open,
  onOpenChange,
  purchase,
  milestoneDate,
}: VehiclePurchaseFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const isEditing = Boolean(purchase);

  const form = useForm<VehiclePurchaseFormData>({
    resolver: zodResolver(vehiclePurchaseSchema) as Resolver<VehiclePurchaseFormData>,
    defaultValues: {
      price_eur: undefined as unknown as number,
      purchased_on: milestoneDate ?? format(new Date(), "yyyy-MM-dd"),
      notes: "",
      extraCosts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "extraCosts",
  });

  useEffect(() => {
    if (!open) return;
    if (purchase) {
      form.reset({
        price_eur: purchase.price_cents / 100,
        purchased_on: purchase.purchased_on,
        notes: purchase.notes ?? "",
        extraCosts: purchase.extraCosts.map((cost) => ({
          label: cost.label,
          amount_eur: cost.amount_cents / 100,
        })),
      });
    } else {
      form.reset({
        price_eur: undefined as unknown as number,
        // Vorbelegung aus dem Kauf-Meilenstein, falls vorhanden
        purchased_on: milestoneDate ?? format(new Date(), "yyyy-MM-dd"),
        notes: "",
        extraCosts: [],
      });
    }
  }, [open, purchase, milestoneDate, form]);

  async function onSubmit(data: VehiclePurchaseFormData) {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const payload = {
        vehicle_id: vehicleId,
        price_cents: eurToCents(data.price_eur),
        purchased_on: data.purchased_on,
        notes: data.notes || null,
      };

      let purchaseId = purchase?.id;

      if (isEditing && purchase) {
        const { error } = await supabase
          .from("vehicle_purchases")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", purchase.id);
        if (error) throw error;
      } else {
        const { data: created, error } = await supabase
          .from("vehicle_purchases")
          .insert({ ...payload, created_by: user.id })
          .select("id")
          .single();
        if (error) throw error;
        purchaseId = created.id;
      }

      if (!purchaseId) throw new Error("Anschaffung konnte nicht angelegt werden");

      // Nebenkosten werden ersetzt statt einzeln abgeglichen: Es sind wenige
      // Zeilen ohne eigene Historie, und ein Abgleich brächte nur Gelegenheiten
      // für Zustände, die nicht mehr zum Formular passen.
      await supabase
        .from("vehicle_purchase_costs")
        .delete()
        .eq("purchase_id", purchaseId);

      const extras = data.extraCosts.filter((cost) => cost.label.trim() !== "");
      if (extras.length > 0) {
        const { error } = await supabase.from("vehicle_purchase_costs").insert(
          extras.map((cost) => ({
            purchase_id: purchaseId,
            vehicle_id: vehicleId,
            label: cost.label.trim(),
            amount_cents: eurToCents(cost.amount_eur),
          }))
        );
        if (error) throw error;
      }

      toast.success(isEditing ? "Anschaffung aktualisiert" : "Anschaffung erfasst");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Anschaffung konnte nicht gespeichert werden:", error);
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
            {isEditing ? "Anschaffung bearbeiten" : "Anschaffung erfassen"}
          </DialogTitle>
        </DialogHeader>

        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Der Kaufpreis ist ausschließlich für dich sichtbar. Er erscheint
            weder im öffentlichen Kurzprofil noch in einem Verkaufsinserat und
            wird auch eingeladenen Mitgliedern nicht angezeigt.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price_eur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kaufpreis (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="18500"
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
                name="purchased_on"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Kaufdatum</FormLabel>
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
            </div>

            {/* Nebenkosten
                Bewusst KEIN FormLabel: Das gehört zu genau einem Feld und ruft
                intern `useFormField()` auf — außerhalb eines `FormField` wirft
                es, und der ganze Dialog öffnet nicht mehr (QA BUG-1). Hier wird
                eine ganze Gruppe beschriftet, deshalb ein Gruppentitel mit
                `aria-labelledby` statt einer Feldbeschriftung. */}
            <div
              className="space-y-2"
              role="group"
              aria-labelledby="nebenkosten-titel"
            >
              <div className="flex items-center justify-between">
                <span id="nebenkosten-titel" className="text-sm font-medium">
                  Nebenkosten des Kaufs (optional)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ label: "", amount_eur: 0 })}
                  disabled={fields.length >= 20}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Position
                </Button>
              </div>

              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Zum Beispiel Überführung, Zulassung oder ein Gutachten beim
                  Kauf. Sie zählen zur Anschaffung, nicht zu den laufenden
                  Kosten.
                </p>
              ) : (
                <div className="space-y-2">
                  {fields.map((row, index) => (
                    <div key={row.id} className="flex items-start gap-2">
                      <FormField
                        control={form.control}
                        name={`extraCosts.${index}.label`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Überführung" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`extraCosts.${index}.amount_eur`}
                        render={({ field }) => (
                          <FormItem className="w-32">
                            <FormControl>
                              <Input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                                placeholder="€"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        aria-label={`Position ${index + 1} entfernen`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
