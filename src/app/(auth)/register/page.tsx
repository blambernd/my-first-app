"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
    showLoginLink?: boolean;
  } | null>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false as unknown as true,
      isWorkshop: false,
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const referralCode = searchParams.get("ref");
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`,
          // Beides landet in raw_user_meta_data und wird beim Anlegen des
          // Kontos von Datenbank-Auslösern gelesen: der Empfehlungscode
          // seit PROJ-18, die Werkstatt-Angabe seit PROJ-39.
          data: {
            ...(referralCode ? { referral_code: referralCode } : {}),
            ...(data.isWorkshop ? { is_workshop: true } : {}),
          },
        },
      });
      if (error) {
        if (error.message.includes("already registered")) {
          setMessage({
            type: "error",
            text: "Es existiert bereits ein Konto mit dieser E-Mail-Adresse.",
            showLoginLink: true,
          });
        } else {
          console.error("Registration error:", error.message, error);
          setMessage({ type: "error", text: `Registrierung fehlgeschlagen: ${error.message}` });
        }
        return;
      }
      // Supabase returns a user with empty identities array if email already exists
      // (instead of an error, to prevent email enumeration)
      if (signUpData.user && signUpData.user.identities?.length === 0) {
        setMessage({
          type: "error",
          text: "Es existiert bereits ein Konto mit dieser E-Mail-Adresse. Bitte melde dich an oder setze dein Passwort zurück.",
        });
        return;
      }
      setMessage({
        type: "success",
        text: "Registrierung erfolgreich! Du wirst zur Startseite weitergeleitet...",
      });
      setTimeout(() => {
        router.push("/?registered=true");
      }, 2000);
    } catch {
      setMessage({ type: "error", text: "Ein Fehler ist aufgetreten" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Konto erstellen</CardTitle>
        <CardDescription>
          Registriere dich bei Oldtimer Docs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <div
            className={`mb-4 rounded-md p-3 text-sm ${
              message.type === "error"
                ? "bg-destructive/10 text-destructive"
                : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            }`}
          >
            {message.text}
            {message.showLoginLink && (
              <>
                {" "}
                <Link href="/login" className="underline font-medium hover:opacity-80">
                  Jetzt anmelden
                </Link>
              </>
            )}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@beispiel.de"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="acceptTerms"
              checked={form.watch("acceptTerms") === true}
              onCheckedChange={(checked) =>
                form.setValue("acceptTerms", checked === true ? true : (false as unknown as true), { shouldValidate: true })
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="acceptTerms" className="text-sm font-normal leading-snug">
                Ich stimme den{" "}
                <Link href="/agb" target="_blank" className="underline underline-offset-4 hover:text-foreground">
                  AGB
                </Link>{" "}
                und der{" "}
                <Link href="/datenschutz" target="_blank" className="underline underline-offset-4 hover:text-foreground">
                  Datenschutzerklärung
                </Link>{" "}
                zu.
              </Label>
              {form.formState.errors.acceptTerms && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.acceptTerms.message}
                </p>
              )}
            </div>
          </div>

          {/* PROJ-39: Getrennt von der Zustimmung darüber — das eine ist
              eine Bedingung, das andere eine Auskunft über sich selbst. */}
          <div className="flex items-start space-x-2 rounded-md border p-3">
            <Checkbox
              id="isWorkshop"
              checked={form.watch("isWorkshop") === true}
              onCheckedChange={(checked) =>
                form.setValue("isWorkshop", checked === true, {
                  shouldValidate: true,
                })
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="isWorkshop"
                className="text-sm font-normal leading-snug"
              >
                Ich bin eine Werkstatt
              </Label>
              <p className="text-muted-foreground text-xs">
                Dann kannst du Fahrzeuge deiner Kunden anlegen und später an
                sie übergeben. Lässt sich jederzeit in den Einstellungen
                ändern.
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Wird registriert..." : "Registrieren"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-sm text-center">
        <p className="w-full text-muted-foreground">
          Bereits ein Konto?{" "}
          <Link
            href="/login"
            className="text-foreground underline-offset-4 hover:underline font-medium"
          >
            Anmelden
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
