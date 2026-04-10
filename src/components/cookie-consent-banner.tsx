"use client";

import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "cookie-consent-accepted";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_CONSENT_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!accepted) setVisible(true);
  }, []);

  function handleAccept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg sm:p-6">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
        <Cookie className="hidden h-8 w-8 shrink-0 text-muted-foreground sm:block" />
        <div className="flex-1 text-sm text-muted-foreground">
          <p>
            Wir verwenden Cookies und ähnliche Technologien, um die
            Funktionalität unserer Website zu gewährleisten und die Nutzung zu
            analysieren. Weitere Informationen findest du in unserer{" "}
            <Link
              href="/datenschutz"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Datenschutzerklärung
            </Link>
            .
          </p>
        </div>
        <Button onClick={handleAccept} className="shrink-0">
          Akzeptieren
        </Button>
      </div>
    </div>
  );
}
