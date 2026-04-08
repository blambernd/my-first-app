"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Eye,
  EyeOff,
  Sparkles,
  Tag,
  ArrowRight,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ListingPhotoSelector } from "@/components/listing-photo-selector";
import { ListingPreview } from "@/components/listing-preview";
import {
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  PRICE_TYPE_LABELS,
  PRICE_TYPES,
  type VehicleListing,
  type PriceType,
} from "@/lib/validations/listing";

interface Photo {
  id: string;
  storage_path: string;
  label: string;
  source: "vehicle" | "milestone";
}

interface VehicleData {
  make: string;
  model: string;
  year: number;
  factory_code: string | null;
  color: string | null;
  engine_type: string | null;
  displacement_ccm: number | null;
  horsepower: number | null;
  mileage_km: number | null;
}

interface MarketPriceData {
  recommended_price_low: number | null;
  recommended_price_high: number | null;
  median_price: number | null;
}

interface ListingEditorProps {
  vehicleId: string;
  vehicleData: VehicleData;
  photos: Photo[];
  hasKurzprofil: boolean;
  kurzprofilToken: string | null;
  marketPrice: MarketPriceData | null;
}

function getImageUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${supabaseUrl}/storage/v1/object/public/vehicle-images/${storagePath}`;
}

function formatEuro(cents: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ListingEditor({
  vehicleId,
  vehicleData,
  photos,
  hasKurzprofil,
  kurzprofilToken,
  marketPrice,
}: ListingEditorProps) {
  const [listing, setListing] = useState<VehicleListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceCents, setPriceCents] = useState<number | null>(null);
  const [priceType, setPriceType] = useState<PriceType>("verhandlungsbasis");
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [photoOrder, setPhotoOrder] = useState<string[]>([]);

  // Price input as string for editing
  const [priceInput, setPriceInput] = useState("");

  const fetchListing = useCallback(async () => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/listing`);
      if (!res.ok && res.status !== 404) throw new Error("Fehler");
      const data = await res.json();
      if (data.listing) {
        applyListing(data.listing);
      }
    } catch {
      toast.error("Fehler beim Laden des Inserats");
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  const applyListing = (l: VehicleListing) => {
    setListing(l);
    setTitle(l.title);
    setDescription(l.description);
    setPriceCents(l.price_cents);
    setPriceType(l.price_type);
    setSelectedPhotoIds(l.selected_photo_ids);
    setPhotoOrder(l.photo_order);
    if (l.price_cents) {
      setPriceInput(String(l.price_cents / 100));
    }
  };

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      // First create, then generate text
      const res = await fetch(`/api/vehicles/${vehicleId}/listing`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      applyListing(data.listing);

      // Auto-generate text
      await handleGenerate(data.listing.id);

      toast.success("Inserat erstellt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Erstellen");
    } finally {
      setCreating(false);
    }
  };

  const handleGenerate = async (listingId?: string) => {
    setGenerating(true);
    try {
      const res = await fetch(
        `/api/vehicles/${vehicleId}/listing/generate`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTitle(data.title);
      setDescription(data.description);
      toast.success("Text generiert");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Fehler bei der Textgenerierung"
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/listing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price_cents: priceCents,
          price_type: priceType,
          selected_photo_ids: selectedPhotoIds,
          photo_order: photoOrder,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setListing(data.listing);
      toast.success("Entwurf gespeichert");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (value: string) => {
    setPriceInput(value);
    const num = parseFloat(value.replace(",", "."));
    if (!isNaN(num) && num >= 0) {
      setPriceCents(Math.round(num * 100));
    } else if (value === "") {
      setPriceCents(null);
    }
  };

  const applyMarketPrice = () => {
    if (!marketPrice?.median_price) return;
    const cents = Math.round(marketPrice.median_price * 100);
    setPriceCents(cents);
    setPriceInput(String(Math.round(marketPrice.median_price)));
  };

  // Build photo URLs for preview
  const previewPhotoUrls = photoOrder
    .map((id) => photos.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => getImageUrl(p!.storage_path));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No listing yet — show create button
  if (!listing) {
    return (
      <div className="text-center py-12">
        <Tag className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium mb-2">Verkaufsinserat erstellen</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          Erstelle ein Inserat für dein Fahrzeug. Titel und Beschreibung werden
          automatisch aus deinen Fahrzeugdaten generiert.
        </p>
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Tag className="h-4 w-4 mr-2" />
          )}
          Inserat erstellen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={listing.status === "entwurf" ? "secondary" : "default"}>
            {listing.status === "entwurf" ? "Entwurf" : "Veröffentlicht"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <EyeOff className="h-4 w-4 mr-1" />
            ) : (
              <Eye className="h-4 w-4 mr-1" />
            )}
            Vorschau
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Speichern
          </Button>
        </div>
      </div>

      <div className={showPreview ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : ""}>
        {/* Editor */}
        <div className="space-y-6">
          {/* Title */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Titel</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleGenerate()}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                  )}
                  Neu generieren
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Mercedes-Benz 230 E (W123) — Baujahr 1982"
                maxLength={TITLE_MAX_LENGTH}
              />
              <p
                className={`text-xs mt-1 ${
                  title.length > TITLE_MAX_LENGTH
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {title.length}/{TITLE_MAX_LENGTH} Zeichen
                {title.length > TITLE_MAX_LENGTH && " — zu lang für mobile.de"}
              </p>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Beschreibung</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={12}
                placeholder="Beschreibe dein Fahrzeug..."
                maxLength={DESCRIPTION_MAX_LENGTH}
                className="resize-y"
              />
              <p
                className={`text-xs mt-1 ${
                  description.length > DESCRIPTION_MAX_LENGTH
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {description.length}/{DESCRIPTION_MAX_LENGTH} Zeichen
              </p>
              {!hasKurzprofil && (
                <Alert className="mt-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Erstelle ein{" "}
                    <a
                      href={`/vehicles/${vehicleId}/kurzprofil`}
                      className="underline font-medium"
                    >
                      Kurzprofil
                    </a>
                    , um deine verifizierte Fahrzeughistorie im Inserat zu
                    verlinken.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Price */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Preis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={priceType}
                onValueChange={(v) => setPriceType(v as PriceType)}
                className="flex gap-4"
              >
                {PRICE_TYPES.map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <RadioGroupItem value={type} id={`price-${type}`} />
                    <Label htmlFor={`price-${type}`} className="text-sm">
                      {PRICE_TYPE_LABELS[type]}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={priceInput}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="0"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    €
                  </span>
                </div>
              </div>

              {marketPrice && marketPrice.median_price && (
                <div className="bg-muted/50 rounded-md p-3 space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Preisempfehlung aus Marktanalyse
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    {marketPrice.recommended_price_low &&
                      marketPrice.recommended_price_high && (
                        <span>
                          {formatEuro(marketPrice.recommended_price_low * 100)} –{" "}
                          {formatEuro(marketPrice.recommended_price_high * 100)}
                        </span>
                      )}
                    <span className="text-muted-foreground">
                      Median: {formatEuro(marketPrice.median_price * 100)}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyMarketPrice}
                  >
                    Median übernehmen
                  </Button>
                </div>
              )}

              {!marketPrice && (
                <p className="text-xs text-muted-foreground">
                  <a
                    href={`/vehicles/${vehicleId}/marktpreis`}
                    className="underline"
                  >
                    Marktanalyse durchführen
                  </a>{" "}
                  für eine Preisempfehlung.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Fotos
                {selectedPhotoIds.length > 0 && (
                  <span className="text-muted-foreground font-normal ml-2">
                    ({selectedPhotoIds.length} ausgewählt)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ListingPhotoSelector
                photos={photos}
                selectedIds={selectedPhotoIds}
                photoOrder={photoOrder}
                onSelectionChange={setSelectedPhotoIds}
                onOrderChange={setPhotoOrder}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 pb-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Entwurf speichern
            </Button>
            {/* Future: PROJ-13 link */}
            <Button variant="outline" disabled>
              Veröffentlichen
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="lg:sticky lg:top-4 lg:self-start">
            <ListingPreview
              title={title}
              description={description}
              priceCents={priceCents}
              priceType={priceType}
              photoUrls={previewPhotoUrls}
              vehicleData={vehicleData}
            />
          </div>
        )}
      </div>
    </div>
  );
}
