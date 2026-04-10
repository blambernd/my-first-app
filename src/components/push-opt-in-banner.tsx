"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const DISMISSED_KEY = "push-opt-in-dismissed";

export function PushOptInBanner() {
  const { status, subscribing, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(true); // default hidden to avoid flash

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
  }, []);

  // Only show for users who haven't subscribed and haven't dismissed
  if (dismissed || status !== "prompt") return null;

  const handleActivate = async () => {
    const success = await subscribe();
    if (success) setDismissed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
      <Bell className="h-5 w-5 text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Push-Benachrichtigungen aktivieren?</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Erhalte Erinnerungen für TÜV-Termine, Wartungen und fällige Services
          direkt auf dein Gerät — auch wenn die App geschlossen ist.
        </p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={handleActivate} disabled={subscribing}>
            {subscribing ? "Wird aktiviert…" : "Ja, aktivieren"}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss}>
            Nein danke
          </Button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
