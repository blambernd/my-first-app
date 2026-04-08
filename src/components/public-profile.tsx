"use client";

import { useState, useEffect } from "react";
import {
  Car,
  Wrench,
  Clock,
  FileText,
  Loader2,
  AlertTriangle,
  Download,
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
    license_plate: string | null;
  };
  fotos?: {
    id: string;
    storage_path: string;
    position: number;
    is_primary: boolean;
  }[];
  scheckheft?: {
    id: string;
    title: string;
    description: string | null;
    service_date: string;
    mileage_km: number | null;
    cost_cents: number | null;
    provider_name: string | null;
    category: string | null;
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
    file_type: string | null;
  }[];
}

function getImageUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${supabaseUrl}/storage/v1/object/public/vehicle-images/${storagePath}`;
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
            <div className="rounded-lg overflow-hidden bg-muted/30 aspect-[21/9] max-h-[300px]">
              <img
                src={getImageUrl(primaryImage.storage_path)}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-contain"
              />
            </div>
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
              Baujahr {vehicle.year}
              {vehicle.year_estimated ? " (geschätzt)" : ""}
            </p>
          </div>
        </div>

        {/* Photo gallery */}
        {data.fotos && data.fotos.length > 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {data.fotos
              .filter((f) => f.id !== primaryImage?.id)
              .map((foto) => (
                <div
                  key={foto.id}
                  className="rounded-md overflow-hidden bg-muted/30 aspect-square"
                >
                  <img
                    src={getImageUrl(foto.storage_path)}
                    alt="Fahrzeugbild"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
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
                      <span className="font-medium">{entry.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatDate(entry.service_date)}
                      </span>
                    </div>
                    {entry.description && (
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {entry.description}
                      </p>
                    )}
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {entry.provider_name && (
                        <span>{entry.provider_name}</span>
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

        {/* Meilensteine */}
        {data.meilensteine && data.meilensteine.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Meilensteine & Restaurierungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.meilensteine.map((milestone) => (
                  <div key={milestone.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{milestone.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatDate(milestone.milestone_date)}
                      </span>
                    </div>
                    {milestone.category && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {milestone.category}
                      </Badge>
                    )}
                    {milestone.description && (
                      <p className="text-muted-foreground text-xs mt-1">
                        {milestone.description}
                      </p>
                    )}
                    {milestone.vehicle_milestone_images.length > 0 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {milestone.vehicle_milestone_images.map((img) => (
                          <div
                            key={img.id}
                            className="shrink-0 w-24 h-24 rounded overflow-hidden bg-muted/30"
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
                    <Separator className="mt-3" />
                  </div>
                ))}
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
                {data.dokumente.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between text-sm py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{doc.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {doc.category && (
                        <Badge variant="outline" className="text-xs">
                          {doc.category}
                        </Badge>
                      )}
                      {doc.document_date && (
                        <span>{formatDate(doc.document_date)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PDF Download */}
        <div className="flex justify-center pt-4 pb-8">
          <Button variant="outline" asChild>
            <a
              href={`/api/profil/${token}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-4 w-4 mr-2" />
              Als PDF herunterladen
            </a>
          </Button>
        </div>

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
