"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface LightboxImage {
  id: string;
  url: string;
  title: string;
  caption?: string | null;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  /** null bedeutet geschlossen. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/**
 * Gemeinsame Vollbildansicht für alle Bildstrecken der App.
 *
 * Ersetzt drei fast identische Implementierungen (Bildergalerie und Historie im
 * Dokumente-Tab sowie die Fahrzeuggalerie), die sich in Details wie Tastatur-
 * bedienung und Umlaufverhalten unterschieden.
 */
export function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: ImageLightboxProps) {
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const isOpen = index !== null && images.length > 0;
  // Schützt gegen einen Index, der nach dem Löschen eines Bildes ins Leere zeigt.
  const safeIndex = isOpen ? Math.min(index, images.length - 1) : 0;

  const step = useCallback(
    (delta: number) => {
      if (images.length === 0) return;
      onIndexChange((safeIndex + delta + images.length) % images.length);
    },
    [images.length, safeIndex, onIndexChange]
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const active = images[safeIndex];
  const hasMultiple = images.length > 1;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="inset-0 max-w-none translate-x-0 translate-y-0 gap-0 border-0 bg-black/95 p-0 text-white sm:inset-0 sm:left-0 sm:top-0 sm:max-h-none sm:max-w-none sm:translate-x-0 sm:translate-y-0 sm:rounded-none">
        <DialogTitle className="sr-only">
          {active.title} — Bild {safeIndex + 1} von {images.length}
        </DialogTitle>

        <div className="relative flex h-full w-full flex-col items-center justify-center">
          <div
            className="flex max-h-[85vh] max-w-[92vw] items-center justify-center"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
              touchDeltaX.current = 0;
            }}
            onTouchMove={(e) => {
              touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
            }}
            onTouchEnd={() => {
              if (touchDeltaX.current > 60) step(-1);
              else if (touchDeltaX.current < -60) step(1);
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.caption || active.title}
              className="max-h-[85vh] max-w-full select-none rounded-lg object-contain"
              draggable={false}
            />
          </div>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Vorheriges Bild"
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white/70 transition-colors hover:bg-black/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Nächstes Bild"
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white/70 transition-colors hover:bg-black/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 max-w-[90vw] -translate-x-1/2 space-y-1 text-center">
            {active.caption && (
              <p className="truncate rounded-full bg-black/50 px-3 py-1 text-sm text-white/90">
                {active.caption}
              </p>
            )}
            {hasMultiple && (
              <p className="inline-block rounded-full bg-black/50 px-3 py-1 text-sm text-white/70">
                {safeIndex + 1} von {images.length}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
