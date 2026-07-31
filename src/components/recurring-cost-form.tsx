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
import { periodsOverlap } from "@/lib/recurring-costs";
import {
  recurringCostSchema,
  RECURRING_COST_TYPES,
  PAYMENT_INTERVALS,
  getIntervalMonths,
  getCostTypeLabel,
  type RecurringCostFormData,
  type RecurringCost,
} from "@/lib/validations/recurring-cost";

interface RecurringCostFormProps {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  /** Vorhandener Eintrag — gesetzt beim Bearbeiten */
  cost?: RecurringCost;
  /** Bestehende Einträge, für die Überlappungsprüfung */
  existingCosts: RecurringCost[];
  /** Versicherungsgesellschaft aus dem Fahrzeugprofil, als Vorbelegung */
  insuranceCompany?: string | null;
}

/**
 * Standardzeitraum: genau zwölf Kalendermonate ab dem laufenden Monat.
 *
 * Vorher war die Voreinstellung „heute bis Jahresende". Das erzeugte still
 * falsche Daten: Wer im Juli einen Jahresbeitrag von 1.200 € eintrug und den
 * Vorschlag übernahm, bekam 200 €/Monat statt 100 € — die Zahl sah plausibel
 * aus und wäre unbemerkt in die Kostenanalyse eingeflossen.
 *
 * Die Umlage rechnet in ganzen Kalendermonaten. Deshalb beginnt der Zeitraum am
 * Monatsersten und endet am letzten Tag des elften Folgemonats — nur so ergeben
 * sich exakt zwölf Monate. Ein Zeitraum vom 31.07. bis zum 30.07. des Folgejahres
 * würde dagegen 13 Kalendermonate berühren.
 */
function defaultPeriod(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 12, 0);
  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  };
}

export function RecurringCostForm({
  vehicleId,
  open,
  onOpenChange,
  onSaved,
  cost,
  existingCosts,
  insuranceCompany,
}: RecurringCostFormProps) {
  const isEditing = Boolean(cost);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const form = useForm<RecurringCostFormData>({
    resolver: zodResolver(recurringCostSchema) as Resolver<RecurringCostFormData>,
    defaultValues: {
      cost_type: "insurance",
      amount_eur: undefined as unknown as number,
      payment_interval: "yearly",
      valid_from: defaultPeriod().from,
      valid_to: defaultPeriod().to,
      provider: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    if (cost) {
      form.reset({
        cost_type: cost.cost_type,
        amount_eur: cost.amount_cents / 100,
        payment_interval: cost.payment_interval,
        valid_from: cost.valid_from,
        valid_to: cost.valid_to,
        provider: cost.provider ?? "",
        notes: cost.notes ?? "",
      });
    } else {
      form.reset({
        cost_type: "insurance",
        amount_eur: undefined as unknown as number,
        payment_interval: "yearly",
        valid_from: defaultPeriod().from,
        valid_to: defaultPeriod().to,
        provider: "",
        notes: "",
      });
    }
  }, [open, cost, form]);

  const costType = form.watch("cost_type");
  const amountEur = form.watch("amount_eur");
  const interval = form.watch("payment_interval");
  const validFrom = form.watch("valid_from");
  const validTo = form.watch("valid_to");
  const provider = form.watch("provider");

  // Bei "Versicherung" die im Fahrzeugprofil hinterlegte Gesellschaft vorschlagen,
  // solange der Nutzer nichts Eigenes eingetragen hat
  useEffect(() => {
    if (!open || isEditing) return;
    if (costType === "insurance" && insuranceCompany && !provider) {
      form.setValue("provider", insuranceCompany);
    }
  }, [open, isEditing, costType, insuranceCompany, provider, form]);

  // Live-Vorschau der Monatsbelastung
  const preview = (() => {
    if (!(amountEur >= 0) || !validFrom || !validTo || validTo <= validFrom) {
      return null;
    }
    const fromIdx =
      Number(validFrom.slice(0, 4)) * 12 + Number(validFrom.slice(5, 7)) - 1;
    const toIdx =
      Number(validTo.slice(0, 4)) * 12 + Number(validTo.slice(5, 7)) - 1;
    const months = toIdx - fromIdx + 1;
    if (months <= 0) return null;
    const payments = Math.ceil(months / getIntervalMonths(interval));
    const totalCents = eurToCents(amountEur) * payments;
    return { months, payments, totalCents, monthlyCents: totalCents / months };
  })();

  // Überlappung mit einem bestehenden Eintrag derselben Kostenart
  const overlapping = validFrom && validTo
    ? existingCosts.filter(
        (other) =>
          other.id !== cost?.id &&
          other.cost_type === costType &&
          periodsOverlap({ valid_from: validFrom, valid_to: validTo }, other)
      )
    : [];

  async function onSubmit(data: RecurringCostFormData) {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const payload = {
        vehicle_id: vehicleId,
        cost_type: data.cost_type,
        amount_cents: eurToCents(data.amount_eur),
        payment_interval: data.payment_interval,
        valid_from: data.valid_from,
        valid_to: data.valid_to,
        provider: data.provider || null,
        notes: data.notes || null,
      };

      if (isEditing && cost) {
        const { error } = await supabase
          .from("recurring_costs")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", cost.id);
        if (error) throw error;
        toast.success("Eintrag aktualisiert");
      } else {
        const { error } = await supabase
          .from("recurring_costs")
          .insert({ ...payload, created_by: user.id });
        if (error) throw error;
        toast.success("Laufende Kosten erfasst");
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error("Laufende Kosten konnten nicht gespeichert werden:", error);
      toast.error(
        error instanceof Error ? error.message : "Speichern fehlgeschlagen"
      );
    } finally {
      setSaving(false);
    }
  }

  function renderDateField(
    name: "valid_from" | "valid_to",
    label: string
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
            {isEditing
              ? "Laufende Kosten bearbeiten"
              : "Laufende Kosten erfassen"}
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
                      {RECURRING_COST_TYPES.map((type) => (
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
                        placeholder="600,00"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>je Zahlung</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zahlungsintervall</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_INTERVALS.map((i) => (
                          <SelectItem key={i.value} value={i.value}>
                            {i.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {renderDateField("valid_from", "Gültig von")}
              {renderDateField("valid_to", "Gültig bis")}
            </div>

            {preview && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="font-medium">
                  entspricht {formatCentsToEur(preview.monthlyCents)} pro Monat
                </p>
                <p className="text-muted-foreground">
                  {preview.months}{" "}
                  {preview.months === 1 ? "Monat" : "Monate"} ·{" "}
                  {preview.payments}{" "}
                  {preview.payments === 1 ? "Zahlung" : "Zahlungen"} ·{" "}
                  {formatCentsToEur(preview.totalCents)} gesamt
                </p>
              </div>
            )}

            {overlapping.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Der Zeitraum überschneidet sich mit{" "}
                  {overlapping.length === 1
                    ? "einem bestehenden Eintrag"
                    : `${overlapping.length} bestehenden Einträgen`}{" "}
                  der Kostenart „{getCostTypeLabel(costType)}&ldquo;. Beide
                  Beträge würden für die überlappenden Monate gezählt. Beim
                  Wechsel mit Übergangsfrist kann das richtig sein — sonst passe
                  einen der Zeiträume an.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anbieter / Bezeichnung (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="z. B. Oldtimer-Versicherung XY" {...field} />
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
