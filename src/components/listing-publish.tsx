"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Download,
  ExternalLink,
  Loader2,
  ShoppingBag,
  Link as LinkIcon,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PLATFORM_IDS,
  PLATFORM_INFO,
  type PlatformId,
  type PlatformEntry,
  type PlatformStatus,
  type VehicleListing,
} from "@/lib/validations/listing";

interface ListingPublishProps {
  listing: VehicleListing;
  vehicleId: string;
  kurzprofilUrl?: string | null;
  onPlatformUpdate: (platforms: PlatformEntry[]) => void;
}

const STATUS_LABELS: Record<PlatformStatus, string> = {
  nicht_veroeffentlicht: "Nicht veröffentlicht",
  aktiv: "Aktiv",
  verkauft: "Verkauft",
};

const STATUS_VARIANTS: Record<PlatformStatus, "secondary" | "default" | "outline"> = {
  nicht_veroeffentlicht: "secondary",
  aktiv: "default",
  verkauft: "outline",
};

function getPlatformEntry(
  platforms: PlatformEntry[],
  platformId: PlatformId
): PlatformEntry {
  return (
    platforms.find((p) => p.platform === platformId) || {
      platform: platformId,
      status: "nicht_veroeffentlicht",
      external_url: "",
      published_at: null,
      updated_at: null,
    }
  );
}

export function ListingPublish({
  listing,
  vehicleId,
  kurzprofilUrl,
  onPlatformUpdate,
}: ListingPublishProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUrls, setEditingUrls] = useState<Record<string, string>>({});

  const platforms = listing.published_platforms || [];

  const handleCopyText = () => {
    let text = `${listing.title}\n\n${listing.description}\n\nPreis: ${
      listing.price_cents
        ? new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 0,
          }).format(listing.price_cents / 100)
        : "Auf Anfrage"
    }`;
    const contact = listing.contact_info;
    if (contact && (contact.name || contact.email || contact.phone || contact.location)) {
      text += "\n\nKontakt:";
      if (contact.name) text += `\n${contact.name}`;
      if (contact.phone) text += `\nTel: ${contact.phone}`;
      if (contact.email) text += `\nE-Mail: ${contact.email}`;
      if (contact.location) text += `\nStandort: ${contact.location}`;
    }
    if (kurzprofilUrl) {
      text += `\n\nFahrzeughistorie: ${kurzprofilUrl}`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Text in Zwischenablage kopiert");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/listing/pdf`);
      if (!res.ok) throw new Error("PDF-Erstellung fehlgeschlagen");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inserat.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF heruntergeladen");
    } catch {
      toast.error("Fehler beim Erstellen des PDFs");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadPhotos = async () => {
    if (listing.selected_photo_ids.length === 0) {
      toast.error("Keine Fotos ausgewählt");
      return;
    }
    setDownloading(true);
    try {
      const res = await fetch(
        `/api/vehicles/${vehicleId}/listing/photos-zip`
      );
      if (!res.ok) throw new Error("Download fehlgeschlagen");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "inserat-fotos.zip";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Fotos heruntergeladen");
    } catch {
      toast.error("Fehler beim Herunterladen der Fotos");
    } finally {
      setDownloading(false);
    }
  };

  const handleUrlChange = (platformId: PlatformId, url: string) => {
    setEditingUrls((prev) => ({ ...prev, [platformId]: url }));
  };

  const handleSaveUrl = async (platformId: PlatformId) => {
    setSaving(true);
    const url = editingUrls[platformId] ?? getPlatformEntry(platforms, platformId).external_url;
    const now = new Date().toISOString();

    const updatedPlatforms = [...platforms];
    const existingIndex = updatedPlatforms.findIndex(
      (p) => p.platform === platformId
    );

    const entry: PlatformEntry = {
      platform: platformId,
      status: url.trim() ? "aktiv" : "nicht_veroeffentlicht",
      external_url: url.trim(),
      published_at:
        url.trim() && !getPlatformEntry(platforms, platformId).published_at
          ? now
          : getPlatformEntry(platforms, platformId).published_at,
      updated_at: now,
    };

    if (existingIndex >= 0) {
      updatedPlatforms[existingIndex] = entry;
    } else {
      updatedPlatforms.push(entry);
    }

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/listing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          published_platforms: updatedPlatforms,
        }),
      });
      if (!res.ok) throw new Error("Fehler beim Speichern");
      onPlatformUpdate(updatedPlatforms);
      toast.success("Link gespeichert");
    } catch {
      toast.error("Fehler beim Speichern des Links");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkSold = async () => {
    setSaving(true);
    const now = new Date().toISOString();
    const updatedPlatforms = platforms.map((p) =>
      p.status === "aktiv"
        ? { ...p, status: "verkauft" as const, updated_at: now }
        : p
    );

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/listing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          published_platforms: updatedPlatforms,
        }),
      });
      if (!res.ok) throw new Error("Fehler beim Speichern");
      onPlatformUpdate(updatedPlatforms);
      toast.success("Als verkauft markiert");
    } catch {
      toast.error("Fehler beim Markieren als verkauft");
    } finally {
      setSaving(false);
    }
  };

  const hasActiveListings = platforms.some((p) => p.status === "aktiv");

  return (
    <div className="space-y-6">
      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-1">Veröffentlichen</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Kopiere dein Inserat und veröffentliche es manuell auf den Plattformen
          deiner Wahl.
        </p>
      </div>

      {/* Global actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleCopyText}>
          {copied ? (
            <Check className="h-4 w-4 mr-1" />
          ) : (
            <Copy className="h-4 w-4 mr-1" />
          )}
          Text kopieren
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPhotos}
          disabled={downloading || listing.selected_photo_ids.length === 0}
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1" />
          )}
          Fotos herunterladen ({listing.selected_photo_ids.length})
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
        >
          {downloadingPdf ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1" />
          )}
          PDF herunterladen
        </Button>
        {hasActiveListings && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkSold}
            disabled={saving}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <ShoppingBag className="h-4 w-4 mr-1" />
            Als verkauft markieren
          </Button>
        )}
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLATFORM_IDS.map((platformId) => {
          const info = PLATFORM_INFO[platformId];
          const entry = getPlatformEntry(platforms, platformId);
          const editUrl =
            editingUrls[platformId] ?? entry.external_url;

          return (
            <Card key={platformId} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {info.name}
                  </CardTitle>
                  <Badge variant={STATUS_VARIANTS[entry.status]}>
                    {STATUS_LABELS[entry.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Platform link */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  asChild
                >
                  <a
                    href={info.createUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Auf {info.name} inserieren
                  </a>
                </Button>

                {/* External URL input */}
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={editUrl}
                      onChange={(e) =>
                        handleUrlChange(platformId, e.target.value)
                      }
                      placeholder="Link zum Live-Inserat einfügen"
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => handleSaveUrl(platformId)}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>

                {/* Tips */}
                <p className="text-[10px] text-muted-foreground">
                  Max {info.maxPhotos} Fotos · Max{" "}
                  {info.maxDescLength.toLocaleString("de-DE")} Zeichen
                </p>

                {/* External link if active */}
                {entry.status === "aktiv" && entry.external_url && (
                  <a
                    href={entry.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary underline truncate block"
                  >
                    Inserat ansehen →
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tips */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Tipp:</strong> Kopiere zuerst den Text, lade dann die Fotos
          herunter, und erstelle das Inserat auf der Plattform deiner Wahl. Füge
          anschließend den Link hier ein, um den Status zu verfolgen.
        </AlertDescription>
      </Alert>
    </div>
  );
}
