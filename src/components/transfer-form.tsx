"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRightLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase";
import {
  transferSchema,
  type TransferFormData,
} from "@/lib/validations/transfer";

interface TransferFormProps {
  vehicleId: string;
  vehicleName: string;
  onSuccess: () => void;
}

export function TransferForm({ vehicleId, vehicleName, onSuccess }: TransferFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferLink, setTransferLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema) as Resolver<TransferFormData>,
    defaultValues: {
      email: "",
      keepAsViewer: true,
    },
  });

  const onSubmit = async (data: TransferFormData) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);

      const { error } = await supabase.from("vehicle_transfers").insert({
        vehicle_id: vehicleId,
        from_user_id: user.id,
        to_email: data.email.toLowerCase().trim(),
        token,
        keep_as_viewer: data.keepAsViewer,
        expires_at: expiresAt.toISOString(),
        status: "offen",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Es gibt bereits einen aktiven Transfer für dieses Fahrzeug");
          return;
        }
        throw error;
      }

      const link = `${window.location.origin}/transfer/${token}`;
      setTransferLink(link);
      setCopied(false);

      // Send email via API route
      try {
        await fetch("/api/transfers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            email: data.email.toLowerCase().trim(),
            vehicleName,
          }),
        });
      } catch {
        // Email sending is best-effort; the link is the primary mechanism
      }

      toast.success("Transfer gestartet — teile den Link mit dem neuen Besitzer");
      form.reset();
      onSuccess();
    } catch {
      toast.error("Fehler beim Starten des Transfers");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!transferLink) return;
    await navigator.clipboard.writeText(transferLink);
    setCopied(true);
    toast.success("Link kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-Mail des neuen Besitzers</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="neuer-besitzer@beispiel.de"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Der neue Besitzer erhält eine E-Mail mit dem Transfer-Link.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="keepAsViewer"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Als Betrachter verknüpft bleiben</FormLabel>
                  <FormDescription>
                    Du behältst Lesezugriff auf das Fahrzeug und seine Historie
                    nach dem Transfer.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                className="w-full"
                disabled={isSubmitting || !form.formState.isValid}
                onClick={() => form.trigger()}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer starten
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Fahrzeug wirklich übertragen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Du überträgst <strong>{vehicleName}</strong> an einen neuen
                  Besitzer. Nach Bestätigung durch den Empfänger verlierst du die
                  Besitzer-Rechte.
                  {form.getValues("keepAsViewer")
                    ? " Du bleibst als Betrachter verknüpft."
                    : " Du verlierst jeglichen Zugriff auf dieses Fahrzeug."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Wird gestartet..." : "Ja, Transfer starten"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      </Form>

      {transferLink && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
          <code className="flex-1 text-sm truncate">{transferLink}</code>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={copyLink}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
