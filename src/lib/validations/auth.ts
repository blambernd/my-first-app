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
     * Selbstauskunft „Ich bin eine Werkstatt" (PROJ-39).
     *
     * Freiwillig und ohne Prüfung — sie schaltet nur eine Ansicht frei und
     * verschafft keinen Zugriff auf fremde Fahrzeuge. Wer sie hier
     * ausgelassen hat, findet sie später in den Einstellungen.
     *
     * `optional` und bewusst **nicht** `.default(false)`: Ein Vorgabewert
     * machte Eingabe- und Ausgabetyp des Schemas verschieden, womit sich
     * der Formular-Resolver nicht mehr typisieren lässt. Ein Pflichtfeld
     * wiederum ließe jede Prüfung scheitern, die das Feld nicht mitschickt
     * — eine freiwillige Angabe darf das nicht. Die Vorbelegung steht im
     * Formular selbst.
     */
    isWorkshop: z.boolean().optional(),
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
