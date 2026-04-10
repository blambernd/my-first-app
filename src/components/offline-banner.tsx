"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine
  );

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <WifiOff className="h-12 w-12 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">Keine Internetverbindung</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Bitte verbinde dich mit dem Internet um fortzufahren.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (navigator.onLine) {
              setIsOffline(false);
            }
          }}
        >
          Erneut versuchen
        </Button>
      </div>
    </div>
  );
}
