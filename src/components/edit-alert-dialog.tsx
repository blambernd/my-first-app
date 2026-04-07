"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  createAlertSchema,
  PART_CONDITIONS,
  type CreateAlertFormData,
  type PartAlert,
} from "@/lib/validations/parts";

interface EditAlertDialogProps {
  vehicleId: string;
  alert: PartAlert;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditAlertDialog({
  vehicleId,
  alert,
  open,
  onOpenChange,
  onSuccess,
}: EditAlertDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateAlertFormData>({
    resolver: zodResolver(createAlertSchema) as Resolver<CreateAlertFormData>,
    defaultValues: {
      searchQuery: alert.search_query,
      maxPrice: alert.max_price_cents != null ? alert.max_price_cents / 100 : "",
      condition: alert.condition_filter,
    },
  });

  // Reset form when alert changes
  useEffect(() => {
    if (open) {
      form.reset({
        searchQuery: alert.search_query,
        maxPrice: alert.max_price_cents != null ? alert.max_price_cents / 100 : "",
        condition: alert.condition_filter,
      });
    }
  }, [open, alert, form]);

  const onSubmit = async (data: CreateAlertFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/vehicles/${vehicleId}/parts/alerts`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: alert.id,
            search_query: data.searchQuery,
            max_price_cents:
              data.maxPrice
                ? Math.round(Number(data.maxPrice) * 100)
                : null,
            condition_filter: data.condition,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Fehler beim Aktualisieren");
      }

      toast.success("Alert aktualisiert");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Fehler beim Aktualisieren"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Alert bearbeiten
          </DialogTitle>
          <DialogDescription>
            Passe Suchbegriff, Maximalpreis oder Zustand-Filter an.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="searchQuery"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suchbegriff</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Bremstrommel, Zündkerze..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Maximalpreis (€){" "}
                    <span className="text-muted-foreground font-normal">
                      — optional
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Kein Limit"
                      min="0"
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zustand</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PART_CONDITIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                )}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
