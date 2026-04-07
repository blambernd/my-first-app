"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Bell, Loader2 } from "lucide-react";
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
} from "@/lib/validations/parts";

interface CreateAlertDialogProps {
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  prefillQuery?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateAlertDialog({
  vehicleId,
  vehicleMake,
  vehicleModel,
  vehicleYear,
  prefillQuery = "",
  open,
  onOpenChange,
  onSuccess,
}: CreateAlertDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateAlertFormData>({
    resolver: zodResolver(createAlertSchema) as Resolver<CreateAlertFormData>,
    defaultValues: {
      searchQuery: prefillQuery,
      maxPrice: "",
      condition: "all",
    },
  });

  // Update prefill when dialog opens with new query
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && prefillQuery) {
      form.setValue("searchQuery", prefillQuery);
    }
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  };

  const onSubmit = async (data: CreateAlertFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/vehicles/${vehicleId}/parts/alerts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            search_query: data.searchQuery,
            max_price_cents:
              data.maxPrice
                ? Math.round(Number(data.maxPrice) * 100)
                : null,
            condition_filter: data.condition,
            vehicle_make: vehicleMake,
            vehicle_model: vehicleModel,
            vehicle_year: vehicleYear,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Fehler beim Erstellen des Alerts");
      }

      toast.success("Such-Alert erstellt", {
        description: `Du wirst benachrichtigt wenn "${data.searchQuery}" gefunden wird.`,
      });
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Fehler beim Erstellen des Alerts"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Such-Alert erstellen
          </DialogTitle>
          <DialogDescription>
            Du wirst benachrichtigt, sobald ein passendes Ersatzteil für deinen{" "}
            {vehicleMake} {vehicleModel} ({vehicleYear}) gefunden wird.
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
                onClick={() => handleOpenChange(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                )}
                Alert erstellen
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
