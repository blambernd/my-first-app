"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Store } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";

interface DealerModeSettingsProps {
  /** Serverseitig gelesener Ausgangszustand */
  initialEnabled: boolean;
}

/**
 * Schalter „Ich verkaufe Fahrzeuge gewerblich" (PROJ-38).
 *
 * Eine Selbstauskunft, keine Prüfung — sie schaltet allein den
 * Bestandsbereich frei und hat keine Außenwirkung: Sie erscheint weder im
 * öffentlichen Kurzprofil noch in Inseraten.
 *
 * Ausschalten verwirft nichts. Die Bestandsvorgänge bleiben gespeichert und
 * stehen beim Wiedereinschalten unverändert da; ausgeblendet wird nur der
 * Bereich.
 */
export function DealerModeSettings({
  initialEnabled,
}: DealerModeSettingsProps) {
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
      // steht `plan`). Der bisherige direkte Schreibversuch traf keine Zeile
      // und meldete trotzdem Erfolg; dieser Schalter hat deshalb seit seiner
      // Auslieferung nie funktioniert.
      const { data, error } = await supabase.rpc("set_business_flags", {
        p_is_dealer: next,
      });

      if (error) throw error;

      const ergebnis = data as
        | { success?: boolean; isDealer?: boolean; error?: string }
        | null;

      if (ergebnis?.error) throw new Error(ergebnis.error);

      if (ergebnis?.isDealer !== next) {
        throw new Error("Die Einstellung wurde nicht übernommen");
      }

      toast.success(
        next
          ? "Bestandsbereich aktiviert"
          : "Bestandsbereich ausgeblendet — deine Vorgänge bleiben erhalten"
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
        <Store className="h-4 w-4 text-muted-foreground" />
        Gewerblicher Handel
      </h2>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="dealer-mode" className="font-normal">
            Ich verkaufe Fahrzeuge gewerblich
          </Label>
          <p className="text-sm text-muted-foreground">
            Schaltet den Bestandsbereich frei: Standzeit je Fahrzeug, Einkauf,
            Verkauf und Rohspanne. Die Angabe ist nur für dich sichtbar.
          </p>
        </div>

        <Switch
          id="dealer-mode"
          checked={enabled}
          disabled={saving}
          onCheckedChange={toggle}
        />
      </div>
    </div>
  );
}
