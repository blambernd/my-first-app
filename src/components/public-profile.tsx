"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Car,
  Wrench,
  Clock,
  FileText,
  Loader2,
  AlertTriangle,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

interface PublicProfileProps {
  token: string;
}

interface ProfileData {
  vehicle: {
    make: string;
    model: string;
    year: number;
    year_estimated: boolean;
    factory_code: string | null;
  };
  stammdaten?: {
    color: string | null;
    engine_type: string | null;
    displacement_ccm: number | null;
    horsepower: number | null;
    mileage_km: number | null;
    body_type: string | null;
    factory_code: string | null;
  };
  fotos?: {
    id: string;
    storage_path: string;
    position: number;
    is_primary: boolean;
  }[];
  scheckheft?: {
    id: string;
    description: string;
    service_date: string;
    mileage_km: number | null;
    cost_cents: number | null;
    workshop_name: string | null;
    entry_type: string | null;
    notes: string | null;
  }[];
  meilensteine?: {
    id: string;
    title: string;
    description: string | null;
    milestone_date: string;
    category: string | null;
    vehicle_milestone_images: {
      id: string;
      storage_path: string;
      caption: string | null;
    }[];
  }[];
  dokumente?: {
    id: string;
    title: string;
    category: string | null;
    document_date: string | null;
    storage_path: string;
    mime_type: string;
  }[];
}

function getImageUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${supabaseUrl}/storage/v1/object/public/vehicle-images/${storagePath}`;
}

function getDocumentUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${supabaseUrl}/storage/v1/object/public/vehicle-documents/${storagePath}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function PublicProfile({ token }: PublicProfileProps) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingDoc, setViewingDoc] = useState<NonNullable<ProfileData["dokumente"]>[0] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const allImages = data?.fotos ?? [];

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevImage = useCallback(() => {
    setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);
  const nextImage = useCallback(() => {
    setLightboxIndex((i) =>
      i !== null && i < allImages.length - 1 ? i + 1 : i
    );
  }, [allImages.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, closeLightbox, prevImage, nextImage]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/profil/${token}`);
        if (res.status === 410) {
          setError("unavailable");
          return;
        }
        if (!res.ok) {
          setError("not_found");
          return;
        }
        const result = await res.json();
        setData(result);
      } catch {
        setError("error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error === "unavailable") {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h1 className="text-xl font-medium mb-2">Nicht mehr verfügbar</h1>
          <p className="text-sm text-muted-foreground">
            Dieses Fahrzeugprofil wurde vom Besitzer deaktiviert und ist nicht
            mehr öffentlich zugänglich.
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Car className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h1 className="text-xl font-medium mb-2">Profil nicht gefunden</h1>
          <p className="text-sm text-muted-foreground">
            Das angeforderte Fahrzeugprofil existiert nicht oder wurde entfernt.
          </p>
        </div>
      </div>
    );
  }

  const { vehicle } = data;
  const primaryImage = data.fotos?.find((f) => f.is_primary) || data.fotos?.[0];

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto flex items-center justify-between h-14 px-4 max-w-4xl">
          <BrandLogo />
          <Badge variant="secondary" className="text-xs">
            Fahrzeugprofil
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Vehicle header */}
        <div className="space-y-4">
          {primaryImage && (
            <button
              type="button"
              className="rounded-lg overflow-hidden bg-muted/30 aspect-[21/9] max-h-[300px] w-full cursor-pointer"
              onClick={() => {
                const idx = allImages.findIndex((f) => f.id === primaryImage.id);
                setLightboxIndex(idx >= 0 ? idx : 0);
              }}
            >
              <img
                src={getImageUrl(primaryImage.storage_path)}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-contain"
              />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {vehicle.make} {vehicle.model}
              {vehicle.factory_code && (
                <span className="text-muted-foreground font-normal ml-2">
                  ({vehicle.factory_code})
                </span>
              )}
            </h1>
            <p className="text-muted-foreground">
              EZ {vehicle.year}
            </p>
          </div>
        </div>

        {/* Photo gallery */}
        {data.fotos && data.fotos.length > 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {data.fotos
              .filter((f) => f.id !== primaryImage?.id)
              .map((foto) => {
                const idx = allImages.findIndex((f) => f.id === foto.id);
                return (
                  <button
                    type="button"
                    key={foto.id}
                    className="rounded-md overflow-hidden bg-muted/30 aspect-square cursor-pointer"
                    onClick={() => setLightboxIndex(idx >= 0 ? idx : 0)}
                  >
                    <img
                      src={getImageUrl(foto.storage_path)}
                      alt="Fahrzeugbild"
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
          </div>
        )}

        {/* Stammdaten */}
        {data.stammdaten && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="h-4 w-4" />
                Fahrzeugdaten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {data.stammdaten.factory_code && (
                  <div>
                    <p className="text-muted-foreground text-xs">Werksbezeichnung</p>
                    <p className="font-medium">{data.stammdaten.factory_code}</p>
                  </div>
                )}
                {data.stammdaten.body_type && (
                  <div>
                    <p className="text-muted-foreground text-xs">Karosserie</p>
                    <p className="font-medium">{data.stammdaten.body_type}</p>
                  </div>
                )}
                {data.stammdaten.color && (
                  <div>
                    <p className="text-muted-foreground text-xs">Farbe</p>
                    <p className="font-medium">{data.stammdaten.color}</p>
                  </div>
                )}
                {data.stammdaten.engine_type && (
                  <div>
                    <p className="text-muted-foreground text-xs">Motortyp</p>
                    <p className="font-medium">{data.stammdaten.engine_type}</p>
                  </div>
                )}
                {data.stammdaten.displacement_ccm && (
                  <div>
                    <p className="text-muted-foreground text-xs">Hubraum</p>
                    <p className="font-medium">
                      {data.stammdaten.displacement_ccm.toLocaleString("de-DE")}{" "}
                      ccm
                    </p>
                  </div>
                )}
                {data.stammdaten.horsepower && (
                  <div>
                    <p className="text-muted-foreground text-xs">Leistung</p>
                    <p className="font-medium">
                      {data.stammdaten.horsepower} PS
                    </p>
                  </div>
                )}
                {data.stammdaten.mileage_km != null && (
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Laufleistung
                    </p>
                    <p className="font-medium">
                      {data.stammdaten.mileage_km.toLocaleString("de-DE")} km
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scheckheft */}
        {data.scheckheft && data.scheckheft.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Scheckheft ({data.scheckheft.length}{" "}
                {data.scheckheft.length === 1 ? "Eintrag" : "Einträge"})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.scheckheft.map((entry) => (
                  <div key={entry.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{entry.description}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatDate(entry.service_date)}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {entry.notes}
                      </p>
                    )}
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {entry.workshop_name && (
                        <span>{entry.workshop_name}</span>
                      )}
                      {entry.mileage_km && (
                        <span>
                          {entry.mileage_km.toLocaleString("de-DE")} km
                        </span>
                      )}
                      {entry.cost_cents && (
                        <span>{formatCents(entry.cost_cents)}</span>
                      )}
                    </div>
                    <Separator className="mt-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meilensteine — Visual Timeline */}
        {data.meilensteine && data.meilensteine.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Fahrzeug-Historie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/30 via-border to-primary/10" />

                <div className="space-y-0">
                  {[...data.meilensteine]
                    .sort((a, b) => b.milestone_date.localeCompare(a.milestone_date))
                    .map((milestone, idx) => {
                    const categoryColors: Record<string, string> = {
                      erstzulassung: "bg-green-100 text-green-600 border-green-200",
                      kauf: "bg-blue-100 text-blue-600 border-blue-200",
                      restauration: "bg-orange-100 text-orange-600 border-orange-200",
                      unfall: "bg-red-100 text-red-600 border-red-200",
                      trophaee: "bg-yellow-100 text-yellow-600 border-yellow-200",
                      lackierung: "bg-violet-100 text-violet-600 border-violet-200",
                      umbau: "bg-cyan-100 text-cyan-600 border-cyan-200",
                      besitzerwechsel: "bg-indigo-100 text-indigo-600 border-indigo-200",
                      sonstiges: "bg-gray-100 text-gray-600 border-gray-200",
                    };
                    const categoryLabels: Record<string, string> = {
                      erstzulassung: "Erstzulassung",
                      kauf: "Kauf",
                      restauration: "Restauration",
                      unfall: "Unfall",
                      trophaee: "Auszeichnung",
                      lackierung: "Lackierung",
                      umbau: "Umbau",
                      besitzerwechsel: "Besitzerwechsel",
                      sonstiges: "Sonstiges",
                    };
                    const colorClass = categoryColors[milestone.category || ""] || categoryColors.sonstiges;

                    return (
                      <div key={milestone.id} className="relative flex gap-4 pb-6 last:pb-0">
                        {/* Node */}
                        <div className="relative z-10 shrink-0">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${colorClass}`}>
                            <span className="text-[10px] font-bold">
                              {new Date(milestone.milestone_date).getFullYear()}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{milestone.title}</span>
                            {milestone.category && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {categoryLabels[milestone.category] || milestone.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(milestone.milestone_date)}
                          </p>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground mt-1.5 whitespace-pre-line">
                              {milestone.description}
                            </p>
                          )}
                          {milestone.vehicle_milestone_images.length > 0 && (
                            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                              {milestone.vehicle_milestone_images.map((img) => (
                                <div
                                  key={img.id}
                                  className="shrink-0 w-28 h-20 rounded-md overflow-hidden bg-muted/30"
                                >
                                  <img
                                    src={getImageUrl(img.storage_path)}
                                    alt={img.caption || "Bild"}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dokumente */}
        {data.dokumente && data.dokumente.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dokumente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.dokumente.map((doc) => {
                  const isImage = doc.mime_type?.startsWith("image/");
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between text-sm py-1.5"
                    >
                      <button
                        type="button"
                        className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer text-left"
                        onClick={() => setViewingDoc(doc)}
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{doc.title}</span>
                      </button>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {doc.category && (
                          <Badge variant="outline" className="text-xs">
                            {doc.category}
                          </Badge>
                        )}
                        {doc.document_date && (
                          <span>{formatDate(doc.document_date)}</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setViewingDoc(doc)}
                          title={isImage ? "Bild anzeigen" : "Dokument anzeigen"}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image lightbox */}
        {lightboxIndex !== null && allImages[lightboxIndex] && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const diff = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(diff) > 50) {
                if (diff > 0) prevImage();
                else nextImage();
              }
              touchStartX.current = null;
            }}
          >
            {/* Close button */}
            <button
              type="button"
              className="absolute top-4 right-4 z-10 text-white/80 hover:text-white"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 text-white/60 text-sm">
              {lightboxIndex + 1} / {allImages.length}
            </div>

            {/* Previous button */}
            {lightboxIndex > 0 && (
              <button
                type="button"
                className="absolute left-2 sm:left-4 z-10 text-white/60 hover:text-white p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
            )}

            {/* Image */}
            <img
              src={getImageUrl(allImages[lightboxIndex].storage_path)}
              alt={`Bild ${lightboxIndex + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain select-none"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />

            {/* Next button */}
            {lightboxIndex < allImages.length - 1 && (
              <button
                type="button"
                className="absolute right-2 sm:right-4 z-10 text-white/60 hover:text-white p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            )}
          </div>
        )}

        {/* Document viewer overlay */}
        {viewingDoc && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="font-medium text-sm">{viewingDoc.title}</h3>
                  {viewingDoc.category && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {viewingDoc.category}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewingDoc(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
                {viewingDoc.mime_type?.startsWith("image/") ? (
                  <img
                    src={getDocumentUrl(viewingDoc.storage_path)}
                    alt={viewingDoc.title}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : viewingDoc.mime_type === "application/pdf" ? (
                  <iframe
                    src={`${getDocumentUrl(viewingDoc.storage_path)}#toolbar=0&navpanes=0`}
                    className="w-full h-[70vh] border-0 rounded"
                    title={viewingDoc.title}
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Vorschau nicht verfügbar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-8">
          <p>
            Erstellt mit{" "}
            <span className="font-medium">Oldtimer Docs</span>
          </p>
        </div>
      </main>
    </div>
  );
}
