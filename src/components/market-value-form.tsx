"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
  marketValueSchema,
  parseEuroToCents,
  type MarketValueFormData,
} from "@/lib/validations/market-value";

interface MarketValueFormProps {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Vorbelegung beim Aktualisieren einer vorhandenen Schätzung */
  currentValueCents?: number | null;
}

export function MarketValueForm({
  vehicleId,
  open,
  onOpenChange,
  currentValueCents,
}: MarketValueFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<MarketValueFormData>({
    resolver: zodResolver(marketValueSchema),
    defaultValues: {
      value_eur:
        currentValueCents != null
          ? String(Math.round(currentValueCents / 100))
          : "",
      valued_on: format(new Date(), "yyyy-MM-dd"),
      note: "",
    },
  });

  const onSubmit = async (data: MarketValueFormData) => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Du bist nicht mehr angemeldet.");
        return;
      }

      // Jede Schätzung wird als neuer Eintrag abgelegt, nicht überschrieben —
      // so entsteht über die Zeit ein Verlauf statt eines Einzelwerts.
      const { error } = await supabase.from("vehicle_market_values").insert({
        vehicle_id: vehicleId,
        user_id: user.id,
        value_cents: parseEuroToCents(data.value_eur),
        valued_on: data.valued_on,
        note: data.note?.trim() ? data.note.trim() : null,
      });

      if (error) throw error;

      toast.success("Marktwert gespeichert");
      onOpenChange(false);
      form.reset();
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Speichern fehlgeschlagen"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marktwert schätzen</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="value_eur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Geschätzter Marktwert (€)</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="decimal"
                      placeholder="18.500"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Was dein Fahrzeug im heutigen Zustand am Markt erzielen
                    würde. Grundlage können ein Gutachten, Vergleichsangebote
                    oder deine eigene Einschätzung sein.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valued_on"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Stand vom</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="justify-start font-normal"
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
                          field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                        }
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vermerk (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="z. B. Gutachten Classic Data, Zustand 2−"
                      {...field}
                    />
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
                disabled={isSaving}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
