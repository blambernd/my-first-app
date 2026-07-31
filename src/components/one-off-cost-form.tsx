"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format, parse } from "date-fns";
import { de } from "date-fns/locale";
import { Loader2, CalendarIcon, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
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
import { eurToCents } from "@/lib/validations/service-entry";
import {
  oneOffCostSchema,
  ONE_OFF_COST_TYPES,
  supportsPartFields,
  type OneOffCostFormData,
  type OneOffCost,
} from "@/lib/validations/one-off-cost";

/** Radix Select erlaubt keinen leeren Item-Wert — dieser Platzhalter steht für „keine Zuordnung" */
const NO_SERVICE_ENTRY = "__keine__";

export interface ServiceEntryOption {
  id: string;
  label: string;
}

interface OneOffCostFormProps {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  cost?: OneOffCost;
  /** Auswahlliste der Scheckheft-Einträge für die optionale Zuordnung */
  serviceEntries: ServiceEntryOption[];
}

export function OneOffCostForm({
  vehicleId,
  open,
  onOpenChange,
  onSaved,
  cost,
  serviceEntries,
}: OneOffCostFormProps) {
  const isEditing = Boolean(cost);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const emptyValues: OneOffCostFormData = {
    cost_type: "parts",
    description: "",
    amount_eur: undefined as unknown as number,
    purchased_at: format(new Date(), "yyyy-MM-dd"),
    quantity: 1,
    part_number: "",
    source: "",
    installed_at: "",
    service_entry_id: "",
    included_in_service_entry: false,
    notes: "",
  };

  const form = useForm<OneOffCostFormData>({
    resolver: zodResolver(oneOffCostSchema) as Resolver<OneOffCostFormData>,
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;
    if (cost) {
      form.reset({
        cost_type: cost.cost_type,
        description: cost.description,
        amount_eur: cost.amount_cents / 100,
        purchased_at: cost.purchased_at,
        quantity: cost.quantity,
        part_number: cost.part_number ?? "",
        source: cost.source ?? "",
        installed_at: cost.installed_at ?? "",
        service_entry_id: cost.service_entry_id ?? "",
        included_in_service_entry: cost.included_in_service_entry,
        notes: cost.notes ?? "",
      });
    } else {
      form.reset(emptyValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cost, form]);

  const costType = form.watch("cost_type");
  const serviceEntryId = form.watch("service_entry_id");
  const showPartFields = supportsPartFields(costType);
  const hasServiceLink = Boolean(serviceEntryId);

  // Ohne Zuordnung ergibt das Kennzeichen keinen Sinn — es wird zurückgesetzt,
  // damit kein Eintrag als "enthalten" markiert bleibt, ohne dass es etwas gäbe,
  // worin er enthalten sein könnte.
  useEffect(() => {
    if (!hasServiceLink) {
      form.setValue("included_in_service_entry", false);
    }
  }, [hasServiceLink, form]);

  async function onSubmit(data: OneOffCostFormData) {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const payload = {
        vehicle_id: vehicleId,
        cost_type: data.cost_type,
        description: data.description,
        amount_cents: eurToCents(data.amount_eur),
        purchased_at: data.purchased_at,
        quantity: showPartFields ? data.quantity : 1,
        part_number: showPartFields ? data.part_number || null : null,
        installed_at: showPartFields ? data.installed_at || null : null,
        source: data.source || null,
        service_entry_id: data.service_entry_id || null,
        included_in_service_entry: data.service_entry_id
          ? data.included_in_service_entry
          : false,
        notes: data.notes || null,
      };

      if (isEditing && cost) {
        const { error } = await supabase
          .from("one_off_costs")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", cost.id);
        if (error) throw error;
        toast.success("Eintrag aktualisiert");
      } else {
        const { error } = await supabase
          .from("one_off_costs")
          .insert({ ...payload, created_by: user.id });
        if (error) throw error;
        toast.success("Einzelkosten erfasst");
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error("Einzelkosten konnten nicht gespeichert werden:", error);
      toast.error(
        error instanceof Error ? error.message : "Speichern fehlgeschlagen"
      );
    } finally {
      setSaving(false);
    }
  }

  function renderDateField(
    name: "purchased_at" | "installed_at",
    label: string,
    noFuture: boolean
  ) {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>{label}</FormLabel>
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
                  disabled={noFuture ? (date) => date > new Date() : undefined}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Einzelkosten bearbeiten" : "Einzelkosten erfassen"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cost_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kostenart</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ONE_OFF_COST_TYPES.map((type) => (
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bezeichnung</FormLabel>
                  <FormControl>
                    <Input placeholder="z. B. Vergaserdichtsatz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount_eur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Betrag (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder="49,90"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    {showPartFields && (
                      <FormDescription>
                        Gesamtpreis für die Menge, nicht Stückpreis
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {renderDateField("purchased_at", "Kaufdatum", true)}
            </div>

            {showPartFields && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Menge</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="numeric"
                            step="1"
                            min="1"
                            {...field}
                            value={field.value ?? 1}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="part_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teilenummer (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="z. B. 111-222-333" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {renderDateField("installed_at", "Einbaudatum (optional)", false)}
              </>
            )}

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bezugsquelle (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="z. B. Teilemarkt Mannheim" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serviceEntries.length > 0 && (
              <FormField
                control={form.control}
                name="service_entry_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Zu einem Scheckheft-Eintrag zuordnen (optional)
                    </FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === NO_SERVICE_ENTRY ? "" : value)
                      }
                      value={field.value || NO_SERVICE_ENTRY}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Keine Zuordnung" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_SERVICE_ENTRY}>
                          Keine Zuordnung
                        </SelectItem>
                        {serviceEntries.map((entry) => (
                          <SelectItem key={entry.id} value={entry.id}>
                            {entry.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {hasServiceLink && (
              <>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Steckt dieser Betrag bereits in den Kosten des
                    Scheckheft-Eintrags? Dann markiere ihn unten — sonst zählt er
                    in der Auswertung ein zweites Mal.
                  </AlertDescription>
                </Alert>

                <FormField
                  control={form.control}
                  name="included_in_service_entry"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5 pr-4">
                        <FormLabel>Betrag ist dort bereits enthalten</FormLabel>
                        <FormDescription>
                          Der Eintrag bleibt in der Liste sichtbar, zählt aber
                          nicht noch einmal zur Summe.
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
              </>
            )}

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
