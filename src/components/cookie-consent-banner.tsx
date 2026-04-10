"use client";

import { useState, useEffect, useCallback } from "react";
import { Cookie, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "cookie-consent";

export type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  comfort: boolean;
};

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  comfort: false,
};

export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as CookiePreferences;
  } catch {
    return null;
  }
}

const CATEGORIES = [
  {
    id: "necessary" as const,
    label: "Notwendig",
    description:
      "Diese Cookies sind für die Grundfunktionen der Website erforderlich (z.\u00a0B. Anmeldung, Sicherheit). Sie können nicht deaktiviert werden.",
    locked: true,
  },
  {
    id: "analytics" as const,
    label: "Analyse",
    description:
      "Helfen uns zu verstehen, wie Besucher die Website nutzen, um sie zu verbessern (z.\u00a0B. Vercel Analytics).",
    locked: false,
  },
  {
    id: "comfort" as const,
    label: "Komfort",
    description:
      "Ermöglichen erweiterte Funktionen und Personalisierung (z.\u00a0B. gespeicherte Einstellungen, Sprachpräferenzen).",
    locked: false,
  },
];

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] =
    useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = getCookiePreferences();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const save = useCallback((prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setVisible(false);
    window.dispatchEvent(new CustomEvent("cookie-consent-update", { detail: prefs }));
  }, []);

  function handleAcceptAll() {
    const all: CookiePreferences = { necessary: true, analytics: true, comfort: true };
    setPreferences(all);
    save(all);
  }

  function handleAcceptSelected() {
    save(preferences);
  }

  function handleRejectOptional() {
    save(DEFAULT_PREFERENCES);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg">
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <Cookie className="mt-0.5 hidden h-8 w-8 shrink-0 text-muted-foreground sm:block" />
          <div className="flex-1 space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>
                Wir verwenden Cookies und ähnliche Technologien, um die
                Funktionalität unserer Website zu gewährleisten und die Nutzung
                zu analysieren. Du kannst selbst entscheiden, welche Kategorien
                du zulassen möchtest. Weitere Informationen findest du in
                unserer{" "}
                <Link
                  href="/datenschutz"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Datenschutzerklärung
                </Link>
                .
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
            >
              {showDetails ? (
                <>
                  Details ausblenden <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Details anzeigen <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>

            {showDetails && (
              <div className="space-y-3 rounded-md border p-4">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="space-y-0.5">
                      <Label
                        htmlFor={`cookie-${cat.id}`}
                        className="text-sm font-medium"
                      >
                        {cat.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {cat.description}
                      </p>
                    </div>
                    <Switch
                      id={`cookie-${cat.id}`}
                      checked={preferences[cat.id]}
                      disabled={cat.locked}
                      onCheckedChange={(checked) =>
                        setPreferences((prev) => ({
                          ...prev,
                          [cat.id]: checked,
                        }))
                      }
                      aria-label={cat.label}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={handleAcceptAll}>Alle akzeptieren</Button>
              {showDetails && (
                <Button variant="outline" onClick={handleAcceptSelected}>
                  Auswahl bestätigen
                </Button>
              )}
              <Button variant="ghost" onClick={handleRejectOptional}>
                Nur notwendige
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
