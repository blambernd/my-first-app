"use client";

import { useState, useEffect } from "react";
import { Analytics } from "@vercel/analytics/next";
import { getCookiePreferences } from "@/components/cookie-consent-banner";

export function ConditionalAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const prefs = getCookiePreferences();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (prefs?.analytics) setEnabled(true);

    function handleUpdate(e: Event) {
      const detail = (e as CustomEvent).detail;
      setEnabled(!!detail?.analytics);
    }

    window.addEventListener("cookie-consent-update", handleUpdate);
    return () => window.removeEventListener("cookie-consent-update", handleUpdate);
  }, []);

  if (!enabled) return null;

  return <Analytics />;
}
