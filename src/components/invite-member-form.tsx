"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send, Copy, Check, Info } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      role: "betrachter",
      can_edit_all: false,
    },
  });

  const watchedRole = form.watch("role");

  const onSubmit = async (data: InviteMemberFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Fehler beim Erstellen der Einladung");
        return;
      }

      setInviteLink(result.inviteUrl);
      setCopied(false);

      if (result.emailSent) {
        toast.success("Einladung per E-Mail versendet");
      } else {
        toast.success("Einladung erstellt — teile den Link mit dem Nutzer");
      }

      form.reset();
      onSuccess();
    } catch {
      toast.error("Fehler beim Erstellen der Einladung");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex gap-3 items-end">
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
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value !== "werkstatt") {
                      form.setValue("can_edit_all", false);
                    }
                  }}
                >
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
        </div>

        {watchedRole === "werkstatt" && (
          <FormField
            control={form.control}
            name="can_edit_all"
            render={({ field }) => (
              <FormItem className="rounded-lg border p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <FormLabel className="text-sm font-medium">Bearbeitungsrechte</FormLabel>
                </div>
                <FormControl>
                  <RadioGroup
                    value={field.value ? "all" : "own"}
                    onValueChange={(v) => field.onChange(v === "all")}
                    className="space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="own" id="perm-own" className="mt-0.5" />
                      <Label htmlFor="perm-own" className="font-normal text-sm leading-snug cursor-pointer">
                        <span className="font-medium">Nur eigene Einträge</span>
                        <br />
                        <span className="text-muted-foreground text-xs">
                          Kann neue Einträge erstellen und nur eigene bearbeiten/löschen
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value="all" id="perm-all" className="mt-0.5" />
                      <Label htmlFor="perm-all" className="font-normal text-sm leading-snug cursor-pointer">
                        <span className="font-medium">Alle Einträge bearbeiten</span>
                        <br />
                        <span className="text-muted-foreground text-xs">
                          Kann zusätzlich auch bestehende Einträge anderer bearbeiten/löschen
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </form>
    </Form>

    {inviteLink && (
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
        <code className="flex-1 text-sm truncate">{inviteLink}</code>
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
