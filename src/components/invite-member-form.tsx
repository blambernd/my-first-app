"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { createClient } from "@/lib/supabase";
import {
  inviteMemberSchema,
  type InviteMemberFormData,
} from "@/lib/validations/member";

interface InviteMemberFormProps {
  vehicleId: string;
  onSuccess: () => void;
}

export function InviteMemberForm({ vehicleId, onSuccess }: InviteMemberFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "betrachter",
    },
  });

  const onSubmit = async (data: InviteMemberFormData) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();

      // Generate a random token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const { error } = await supabase.from("vehicle_invitations").insert({
        vehicle_id: vehicleId,
        email: data.email.toLowerCase().trim(),
        token,
        role: data.role,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        status: "offen",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Diese E-Mail wurde bereits eingeladen");
          return;
        }
        throw error;
      }

      toast.success(`Einladung an ${data.email} gesendet`);
      form.reset();
      onSuccess();
    } catch {
      toast.error("Fehler beim Senden der Einladung");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-3 items-end">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>E-Mail-Adresse</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="werkstatt@beispiel.de"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rolle</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="werkstatt">Werkstatt</SelectItem>
                  <SelectItem value="betrachter">Betrachter</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="shrink-0">
          <Send className="h-4 w-4 mr-1.5" />
          {isSubmitting ? "Sende..." : "Einladen"}
        </Button>
      </form>
    </Form>
  );
}
