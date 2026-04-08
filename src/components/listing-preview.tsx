"use client";

import { Car, MapPin, Calendar, Gauge, User, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PRICE_TYPE_LABELS, type PriceType } from "@/lib/validations/listing";

interface ListingPreviewProps {
  title: string;
  description: string;
  priceCents: number | null;
  priceType: PriceType;
  photoUrls: string[];
  vehicleData: {
    make: string;
    model: string;
    year: number;
    mileage_km: number | null;
    color: string | null;
    horsepower: number | null;
    displacement_ccm: number | null;
    engine_type: string | null;
  };
  kurzprofilUrl?: string | null;
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
    location: string;
  } | null;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ListingPreview({
  title,
  description,
  priceCents,
  priceType,
  photoUrls,
  vehicleData,
  kurzprofilUrl,
  contactInfo,
}: ListingPreviewProps) {
  const primaryPhoto = photoUrls[0];

  return (
    <Card className="overflow-hidden">
      <div className="bg-muted/30 px-3 py-1.5 border-b">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          Vorschau — So sieht dein Inserat aus
        </p>
      </div>

      {/* Hero image */}
      {primaryPhoto ? (
        <div className="aspect-[16/9] bg-muted/20 overflow-hidden">
          <img
            src={primaryPhoto}
            alt={title || "Fahrzeugbild"}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-muted/20 flex items-center justify-center">
          <Car className="h-12 w-12 text-muted-foreground/20" />
        </div>
      )}

      {/* Photo strip */}
      {photoUrls.length > 1 && (
        <div className="flex gap-1 p-1 bg-muted/10 overflow-x-auto">
          {photoUrls.slice(1, 6).map((url, i) => (
            <div
              key={i}
              className="shrink-0 w-16 h-16 rounded overflow-hidden bg-muted/30"
            >
              <img
                src={url}
                alt={`Bild ${i + 2}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {photoUrls.length > 6 && (
            <div className="shrink-0 w-16 h-16 rounded bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
              +{photoUrls.length - 6}
            </div>
          )}
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Title & Price */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-lg leading-tight">
            {title || (
              <span className="text-muted-foreground italic">Kein Titel</span>
            )}
          </h3>
          <div className="text-right shrink-0">
            {priceCents ? (
              <>
                <p className="font-bold text-lg text-primary">
                  {formatPrice(priceCents)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {PRICE_TYPE_LABELS[priceType]}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Preis auf Anfrage
              </p>
            )}
          </div>
        </div>

        {/* Vehicle quick facts */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <Calendar className="h-3 w-3" />
            EZ {vehicleData.year}
          </Badge>
          {vehicleData.mileage_km != null && (
            <Badge variant="outline" className="text-xs gap-1">
              <Gauge className="h-3 w-3" />
              {vehicleData.mileage_km.toLocaleString("de-DE")} km
            </Badge>
          )}
          {vehicleData.horsepower && (
            <Badge variant="outline" className="text-xs">
              {vehicleData.horsepower} PS
            </Badge>
          )}
          {vehicleData.displacement_ccm && (
            <Badge variant="outline" className="text-xs">
              {vehicleData.displacement_ccm.toLocaleString("de-DE")} ccm
            </Badge>
          )}
          {vehicleData.engine_type && (
            <Badge variant="outline" className="text-xs">
              {vehicleData.engine_type}
            </Badge>
          )}
          {vehicleData.color && (
            <Badge variant="outline" className="text-xs">
              {vehicleData.color}
            </Badge>
          )}
        </div>

        <Separator />

        {/* Description */}
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {description || (
            <span className="text-muted-foreground italic">
              Keine Beschreibung
            </span>
          )}
        </div>

        {/* Contact info */}
        {contactInfo && (contactInfo.name || contactInfo.email || contactInfo.phone || contactInfo.location) && (
          <>
            <Separator />
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kontakt</p>
              {contactInfo.name && (
                <p className="text-sm flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {contactInfo.name}
                </p>
              )}
              {contactInfo.email && (
                <p className="text-sm flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {contactInfo.email}
                </p>
              )}
              {contactInfo.phone && (
                <p className="text-sm flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {contactInfo.phone}
                </p>
              )}
              {contactInfo.location && (
                <p className="text-sm flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {contactInfo.location}
                </p>
              )}
            </div>
          </>
        )}

        {/* Kurzprofil link */}
        {kurzprofilUrl && (
          <>
            <Separator />
            <div className="flex items-center gap-3 bg-muted/30 rounded-md p-3">
              <div className="shrink-0 w-16 h-16 bg-muted rounded flex items-center justify-center">
                <svg viewBox="0 0 21 21" className="w-12 h-12">
                  <rect width="21" height="21" fill="white" rx="2" />
                  <text x="10.5" y="12" textAnchor="middle" fontSize="5" fill="#666">QR</text>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium">Vollständige Fahrzeughistorie</p>
                <a
                  href={kurzprofilUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline truncate block"
                >
                  {kurzprofilUrl}
                </a>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
