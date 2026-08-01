"use client";

import { useState } from "react";
import { Car, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export interface GalleryImage {
  id: string;
  url: string;
}

interface VehicleGalleryProps {
  images: GalleryImage[];
  /** Für alt-Texte, z.B. "Mercedes-Benz SL380" */
  vehicleName: string;
}

export function VehicleGallery({ images, vehicleName }: VehicleGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (images.length === 0) {
    return (
      <div className="rounded-lg bg-muted/10 aspect-[4/3] flex items-center justify-center">
        <Car className="h-12 w-12 text-muted-foreground/15" />
      </div>
    );
  }

  // Schützt gegen einen Index, der nach dem Entfernen eines Bildes ins Leere zeigt.
  const safeIndex = Math.min(activeIndex, images.length - 1);
  const active = images[safeIndex];

  const step = (delta: number) => {
    setActiveIndex((i) => {
      const next = (i + delta + images.length) % images.length;
      return next;
    });
  };

  return (
    <>
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          aria-label="Bild formatfüllend anzeigen"
          className="group relative block w-full rounded-lg overflow-hidden bg-muted/30 aspect-[4/3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={vehicleName}
            className="w-full h-full object-contain"
          />
          <span className="absolute bottom-2 right-2 rounded-md bg-background/80 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Expand className="h-4 w-4 text-foreground/70" />
          </span>
        </button>

        {images.length > 1 && (
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={`Bild ${i + 1} von ${images.length} anzeigen`}
                aria-current={i === safeIndex}
                className={`aspect-[4/3] rounded overflow-hidden bg-muted/30 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  i === safeIndex
                    ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-5xl p-2 sm:p-4">
          <DialogTitle className="sr-only">
            {vehicleName} — Bild {safeIndex + 1} von {images.length}
          </DialogTitle>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={vehicleName}
              className="w-full max-h-[80vh] object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Vorheriges Bild"
                  className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Nächstes Bild"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <p className="text-center text-xs text-muted-foreground">
              {safeIndex + 1} von {images.length}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
