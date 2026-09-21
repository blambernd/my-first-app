"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Wrench } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";

interface WorkshopModeSettingsProps {
  /** Serverseitig gelesener Ausgangszustand */
  initialEnabled: boolean;
}

/**
 * Schalter „Ich bin eine Werkstatt" (PROJ-39).
 *
 * Eine Selbstauskunft ohne Prüfung — und das ist sicher, weil sie keinen
 * Zugriff auf fremde Fahrzeuge verschafft. Sie schaltet den
 * Werkstattbereich frei und erlaubt dort das Anlegen eigener
 * Kundenfahrzeuge; das Einsehen fremder Fahrzeuge bleibt an die Einladung
 * des Besitzers gebunden (PROJ-6). Wer die Angabe wahrheitswidrig setzt,
 * gewinnt nichts.
 *
 * Ausschalten verwirft nichts: Die angelegten Fahrzeuge bleiben Eigentum
 * des Kontos und erscheinen weiterhin im Dashboard. Ausgeblendet wird nur
 * der Bereich.
 */
export function WorkshopModeSettings({
  initialEnabled,
}: WorkshopModeSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  const toggle = async (next: boolean) => {
    setSaving(true);
    // Sofort umschalten, damit der Schalter nicht hängt — bei einem Fehler
    // wird zurückgenommen.
    setEnabled(next);

    try {
      const supabase = createClient();

      // BUG-1: Nicht direkt auf die Tabelle schreiben — `subscriptions` ist
      // für den Browser absichtlich schreibgeschützt (in derselben Zeile
      // steht `plan`). Ein direkter Schreibversuch trifft keine Zeile und
      // meldet trotzdem HTTP 200 ohne Fehler. Diese Funktion setzt
      // ausschließlich die Selbstauskunft und gibt zurück, was gespeichert
      // wurde.
      const { data, error } = await supabase.rpc("set_business_flags", {
        p_is_workshop: next,
      });

      if (error) throw error;

      const ergebnis = data as
        | { success?: boolean; isWorkshop?: boolean; error?: string }
        | null;

      if (ergebnis?.error) throw new Error(ergebnis.error);

      // Geprüft, nicht geglaubt: Genau diese Prüfung fehlte und ließ den
      // Fehler monatelang unbemerkt.
      if (ergebnis?.isWorkshop !== next) {
        throw new Error("Die Einstellung wurde nicht übernommen");
      }

      toast.success(
        next
          ? "Werkstattbereich aktiviert"
          : "Werkstattbereich ausgeblendet — deine Fahrzeuge bleiben erhalten"
      );
      // Der Navigationspunkt wird serverseitig entschieden, deshalb ein
      // vollständiges Neuladen statt eines Router-Refreshs.
      window.location.reload();
    } catch {
      setEnabled(!next);
      toast.error("Einstellung konnte nicht gespeichert werden");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h2 className="flex items-center gap-2 text-base font-medium">
        <Wrench className="h-4 w-4 text-muted-foreground" />
        Werkstatt
      </h2>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="workshop-mode" className="font-normal">
            Ich bin eine Werkstatt
          </Label>
          <p className="text-sm text-muted-foreground">
            Schaltet den Werkstattbereich frei: Du kannst Fahrzeuge deiner
            Kunden selbst anlegen, die Wartung dokumentieren und sie später an
            den Kunden übergeben. Die Angabe ist nur für dich sichtbar.
          </p>
        </div>

        <Switch
          id="workshop-mode"
          checked={enabled}
          disabled={saving}
          onCheckedChange={toggle}
        />
      </div>

      {enabled && (
        <p className="text-muted-foreground border-t pt-3 text-xs">
          Legst du Fahrzeuge für Kunden an, verarbeitest du deren Daten in
          eigener Verantwortung. Hinterlege nur, was du für die Dokumentation
          brauchst, und übergib das Fahrzeug an den Kunden, sobald er ein Konto
          hat. Zugriff auf Fahrzeuge anderer Nutzer erhältst du dadurch nicht —
          dafür muss der Besitzer dich weiterhin einladen.
        </p>
      )}
    </div>
  );
}
