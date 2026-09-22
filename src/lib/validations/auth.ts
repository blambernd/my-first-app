import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-Mail ist erforderlich")
    .email("Ungültige E-Mail-Adresse"),
  password: z
    .string()
    .min(1, "Passwort ist erforderlich"),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "E-Mail ist erforderlich")
      .email("Ungültige E-Mail-Adresse"),
    password: z
      .string()
      .min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
    confirmPassword: z
      .string()
      .min(1, "Passwort-Bestätigung ist erforderlich"),
    acceptTerms: z
      .literal(true, {
        message: "Du musst den AGB und der Datenschutzerklärung zustimmen",
      }),
    /**
     * Wie das Konto genutzt wird (PROJ-39, PROJ-38).
     *
     * Eine Selbstauskunft ohne Prüfung. Sie schaltet Ansichten frei und
     * verschafft **keinen** Zugriff auf fremde Fahrzeuge — deshalb ist sie
     * ungeprüft unbedenklich. Jederzeit in den Einstellungen änderbar.
     *
     * Einfachauswahl, obwohl ein Betrieb reparieren **und** verkaufen kann:
     * Bei der Anmeldung zählt der Haupteinstieg, und wer beides braucht,
     * legt den zweiten Schalter später um. Eine Mehrfachauswahl an dieser
     * Stelle kostet mehr Klarheit, als sie Fälle abdeckt.
     *
     * `optional` und bewusst **nicht** `.default()`: Ein Vorgabewert machte
     * Eingabe- und Ausgabetyp des Schemas verschieden, womit sich der
     * Formular-Resolver nicht mehr typisieren lässt. Ein Pflichtfeld
     * wiederum ließe jede Prüfung scheitern, die das Feld nicht mitschickt.
     * Die Vorbelegung steht im Formular selbst.
     */
    accountType: z.enum(["privat", "werkstatt", "haendler"]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "E-Mail ist erforderlich")
    .email("Ungültige E-Mail-Adresse"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
    confirmPassword: z
      .string()
      .min(1, "Passwort-Bestätigung ist erforderlich"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  });

export const magicLinkSchema = z.object({
  email: z
    .string()
    .min(1, "E-Mail ist erforderlich")
    .email("Ungültige E-Mail-Adresse"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type MagicLinkFormData = z.infer<typeof magicLinkSchema>;
