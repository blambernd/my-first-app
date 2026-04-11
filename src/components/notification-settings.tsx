"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Loader2, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";

interface Preferences {
  reminder_days: number;
  tuv_enabled: boolean;
  service_enabled: boolean;
  email_enabled: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  reminder_days: 7,
  tuv_enabled: true,
  service_enabled: true,
  email_enabled: true,
};

export function NotificationSettings() {
  const { status, subscribing, subscribe, unsubscribe } = usePushNotifications();
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      const res = await fetch("/api/push/preferences");
      if (res.ok) {
        const data = await res.json();
        if (data) setPrefs(data);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const savePreferences = async (updated: Preferences) => {
    setPrefs(updated);
    setSaving(true);
    try {
      await fetch("/api/push/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch {
      // Silently fail — prefs are already updated in UI
    } finally {
      setSaving(false);
    }
  };

  const isActive = status === "granted";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {isActive ? (
            <Bell className="h-4 w-4" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          Push-Benachrichtigungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Push toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">
              Push-Nachrichten
            </Label>
            <p className="text-xs text-muted-foreground">
              {status === "unsupported"
                ? "Dein Browser unterstützt keine Push-Nachrichten"
                : status === "denied"
                  ? "Push-Berechtigung wurde verweigert. Bitte erlaube Benachrichtigungen in den Browser-Einstellungen."
                  : isActive
                    ? "Erinnerungen werden an dieses Gerät gesendet"
                    : "Aktiviere Push für Termin-Erinnerungen"}
            </p>
          </div>
          {status !== "unsupported" && (
            <Switch
              checked={isActive}
              disabled={subscribing || status === "denied"}
              onCheckedChange={async (checked) => {
                if (checked) await subscribe();
                else await unsubscribe();
              }}
            />
          )}
        </div>

        {/* Preferences — only show when active */}
        {isActive && !loading && (
          <>
            <div className="border-t pt-4 space-y-4">
              {/* Reminder timing */}
              <div className="flex items-center justify-between">
                <Label className="text-sm">Erinnerung vorab</Label>
                <Select
                  value={String(prefs.reminder_days)}
                  onValueChange={(val) =>
                    savePreferences({ ...prefs, reminder_days: Number(val) })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Tag vorher</SelectItem>
                    <SelectItem value="7">7 Tage vorher</SelectItem>
                    <SelectItem value="14">14 Tage vorher</SelectItem>
                    <SelectItem value="30">30 Tage vorher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type toggles */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Erinnerungstypen
                </p>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">TÜV / HU</Label>
                  <Switch
                    checked={prefs.tuv_enabled}
                    onCheckedChange={(checked) =>
                      savePreferences({ ...prefs, tuv_enabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Service / Wartung</Label>
                  <Switch
                    checked={prefs.service_enabled}
                    onCheckedChange={(checked) =>
                      savePreferences({ ...prefs, service_enabled: checked })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-4">
                  Benachrichtigungskanal
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" />
                      E-Mail-Benachrichtigung
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Zusätzlich zur Glocke auch per E-Mail erinnern
                    </p>
                  </div>
                  <Switch
                    checked={prefs.email_enabled}
                    onCheckedChange={(checked) =>
                      savePreferences({ ...prefs, email_enabled: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {saving && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Wird gespeichert…
              </div>
            )}
          </>
        )}

        {/* Activate button when not subscribed */}
        {status === "prompt" && (
          <Button
            onClick={subscribe}
            disabled={subscribing}
            className="w-full"
            size="sm"
          >
            {subscribing ? "Wird aktiviert…" : "Push-Benachrichtigungen aktivieren"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
