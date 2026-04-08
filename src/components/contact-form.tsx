"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Card,
  CardContent,
} from "@/components/ui/card";

const CATEGORIES = [
  { value: "general", label: "Allgemeine Anfrage" },
  { value: "improvement", label: "Verbesserungsvorschlag" },
  { value: "bug", label: "Bug melden" },
  { value: "account", label: "Account / Datenschutz" },
] as const;

const contactSchema = z.object({
  category: z.enum(["general", "improvement", "bug", "account"], {
    error: "Bitte w\u00e4hlen Sie eine Kategorie.",
  }),
  name: z
    .string()
    .min(2, "Name muss mindestens 2 Zeichen lang sein.")
    .max(100, "Name darf maximal 100 Zeichen lang sein."),
  email: z
    .string()
    .min(1, "E-Mail-Adresse ist erforderlich.")
    .email("Bitte geben Sie eine gültige E-Mail-Adresse ein."),
  subject: z
    .string()
    .min(3, "Betreff muss mindestens 3 Zeichen lang sein.")
    .max(200, "Betreff darf maximal 200 Zeichen lang sein."),
  message: z
    .string()
    .min(10, "Nachricht muss mindestens 10 Zeichen lang sein.")
    .max(5000, "Nachricht darf maximal 5000 Zeichen lang sein."),
  bugUrl: z
    .string()
    .url("Bitte geben Sie eine gültige URL ein.")
    .optional()
    .or(z.literal("")),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      category: undefined,
      name: "",
      email: "",
      subject: "",
      message: "",
      bugUrl: "",
    },
  });

  const selectedCategory = form.watch("category");
  const messageLength = form.watch("message")?.length ?? 0;

  async function onSubmit(data: ContactFormData) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || "Beim Senden ist ein Fehler aufgetreten."
        );
      }

      setIsSuccess(true);
      form.reset();
      toast.success("Nachricht gesendet", {
        description: "Vielen Dank! Wir melden uns bei Ihnen.",
      });
    } catch (error) {
      toast.error("Fehler beim Senden", {
        description:
          error instanceof Error
            ? error.message
            : "Bitte versuchen Sie es später erneut.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <h2 className="text-xl font-semibold mb-2">
            Vielen Dank für Ihre Nachricht!
          </h2>
          <p className="text-muted-foreground mb-6">
            Wir haben Ihre Anfrage erhalten und melden uns so schnell wie
            möglich bei Ihnen.
          </p>
          <Button variant="outline" onClick={() => setIsSuccess(false)}>
            Weitere Nachricht senden
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bitte wählen..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ihr Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-Mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="ihre@email.de"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Betreff</FormLabel>
                  <FormControl>
                    <Input placeholder="Worum geht es?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nachricht</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Beschreiben Sie Ihr Anliegen..."
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground ml-auto">
                      {messageLength}/5000
                    </span>
                  </div>
                </FormItem>
              )}
            />

            {selectedCategory === "bug" && (
              <FormField
                control={form.control}
                name="bugUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL der betroffenen Seite (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Wird gesendet..." : "Nachricht senden"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
