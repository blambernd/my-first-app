"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  TrendingUp,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
  MarketAnalysis,
  MarketAnalysisListing,
} from "@/lib/validations/market-analysis";

interface MarketAnalysisProps {
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleFactoryCode?: string | null;
  vehicleMileageKm?: number | null;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

const PLATFORM_COLORS: Record<string, string> = {
  "mobile.de": "bg-blue-100 text-blue-800",
  "Classic Trader": "bg-amber-100 text-amber-800",
  eBay: "bg-red-100 text-red-800",
};

function ListingCard({ listing }: { listing: MarketAnalysisListing }) {
  return (
    <a
      href={listing.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate group-hover:text-primary transition-colors ${listing.is_outlier ? "text-muted-foreground" : ""}`}>
          {listing.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge
            className={`${PLATFORM_COLORS[listing.platform] || "bg-gray-100 text-gray-800"} border-0 text-xs`}
          >
            {listing.platform}
          </Badge>
          {listing.is_outlier && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Ausreißer
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`font-semibold text-sm ${listing.is_outlier ? "text-muted-foreground" : ""}`}>
          {listing.price != null ? formatPrice(listing.price) : "Preis n.A."}
        </span>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  );
}

function PriceSummaryCard({ analysis }: { analysis: MarketAnalysis }) {
  if (analysis.status !== "completed") return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Preisübersicht
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Durchschnitt</p>
            <p className="text-lg font-semibold">
              {analysis.average_price != null
                ? formatPrice(analysis.average_price)
                : "–"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Median</p>
            <p className="text-lg font-semibold">
              {analysis.median_price != null
                ? formatPrice(analysis.median_price)
                : "–"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Niedrigster</p>
            <p className="text-lg font-semibold text-green-600">
              {analysis.lowest_price != null
                ? formatPrice(analysis.lowest_price)
                : "–"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Höchster</p>
            <p className="text-lg font-semibold text-red-600">
              {analysis.highest_price != null
                ? formatPrice(analysis.highest_price)
                : "–"}
            </p>
          </div>
        </div>
        <Separator className="my-4" />
        <p className="text-xs text-muted-foreground">
          Basierend auf {analysis.listing_count} Inserat{analysis.listing_count !== 1 ? "en" : ""}
        </p>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ analysis }: { analysis: MarketAnalysis }) {
  if (
    analysis.status !== "completed" ||
    analysis.recommended_price_low == null ||
    analysis.recommended_price_high == null
  )
    return null;

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Preisempfehlung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-primary">
            {formatPrice(analysis.recommended_price_low)}
          </span>
          <span className="text-muted-foreground">–</span>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(analysis.recommended_price_high)}
          </span>
        </div>
        {analysis.recommendation_reasoning && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {analysis.recommendation_reasoning}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-4 pt-3 border-t leading-relaxed">
          Hinweis: Diese Preisindikation basiert auf öffentlich verfügbaren Inseraten und dient nur zur Orientierung. Der tatsächliche Marktwert hängt von vielen Faktoren ab, u.a. Zustand, Laufleistung, Matching Numbers, Seltenheit, Ausstattung und Dokumentation.
        </p>
      </CardContent>
    </Card>
  );
}

function AnalysisResultView({ analysis }: { analysis: MarketAnalysis }) {
  const [listingsExpanded, setListingsExpanded] = useState(false);

  if (analysis.status === "pending") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (analysis.status === "error") {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Analyse fehlgeschlagen</p>
              <p className="text-sm text-muted-foreground mt-1">
                {analysis.error_message || "Ein unerwarteter Fehler ist aufgetreten."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analysis.status === "insufficient_data") {
    return (
      <Card className="border-amber-300/50">
        <CardContent className="py-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Zu wenige Daten für eine Preisschätzung</p>
              <p className="text-sm text-muted-foreground mt-1">
                Es wurden weniger als 2 vergleichbare Inserate mit Preisangabe gefunden.
                Versuchen Sie es später erneut, wenn mehr Angebote verfügbar sind.
              </p>
              {analysis.listings.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Gefunden: {analysis.listings.length} Inserat{analysis.listings.length !== 1 ? "e" : ""}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleListings = listingsExpanded
    ? analysis.listings
    : analysis.listings.slice(0, 5);

  return (
    <div className="space-y-4">
      <PriceSummaryCard analysis={analysis} />
      <RecommendationCard analysis={analysis} />

      {analysis.listings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Vergleichbare Inserate ({analysis.listings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <div className="divide-y">
              {visibleListings.map((listing, i) => (
                <ListingCard key={i} listing={listing} />
              ))}
            </div>
            {analysis.listings.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-muted-foreground"
                onClick={() => setListingsExpanded(!listingsExpanded)}
              >
                {listingsExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Weniger anzeigen
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Alle {analysis.listings.length} Inserate anzeigen
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HistoryItem({
  analysis,
  onSelect,
  isSelected,
}: {
  analysis: MarketAnalysis;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const statusLabels: Record<string, string> = {
    completed: "Abgeschlossen",
    insufficient_data: "Zu wenige Daten",
    error: "Fehler",
    pending: "Läuft...",
  };

  const statusColors: Record<string, string> = {
    completed: "bg-green-100 text-green-800",
    insufficient_data: "bg-amber-100 text-amber-800",
    error: "bg-red-100 text-red-800",
    pending: "bg-blue-100 text-blue-800",
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-md transition-colors ${
        isSelected
          ? "bg-primary/5 border border-primary/20"
          : "hover:bg-muted/50 border border-transparent"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {formatDate(analysis.created_at)}
        </span>
        <Badge className={`${statusColors[analysis.status]} border-0 text-xs`}>
          {statusLabels[analysis.status]}
        </Badge>
      </div>
      {analysis.status === "completed" && analysis.median_price != null && (
        <p className="text-xs text-muted-foreground mt-1">
          Median: {formatPrice(analysis.median_price)} · {analysis.listing_count} Inserate
        </p>
      )}
    </button>
  );
}

export function MarketAnalysis({
  vehicleId,
  vehicleMake,
  vehicleModel,
  vehicleYear,
  vehicleFactoryCode,
  vehicleMileageKm,
}: MarketAnalysisProps) {
  const [analyses, setAnalyses] = useState<MarketAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<MarketAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const fetchAnalyses = useCallback(async () => {
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/market-analysis`);
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data = await res.json();
      setAnalyses(data.analyses || []);
      if (data.analyses?.length > 0 && !selectedAnalysis) {
        setSelectedAnalysis(data.analyses[0]);
      }
    } catch {
      toast.error("Marktanalysen konnten nicht geladen werden.");
    } finally {
      setIsFetching(false);
    }
  }, [vehicleId, selectedAnalysis]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const startAnalysis = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/market-analysis`, {
        method: "POST",
      });

      if (res.status === 429) {
        const data = await res.json();
        toast.error(data.error || "Tageslimit erreicht (max. 5 Analysen pro Fahrzeug pro Tag).");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analyse fehlgeschlagen");
      }

      const data = await res.json();
      const newAnalysis = data.analysis as MarketAnalysis;
      setAnalyses((prev) => [newAnalysis, ...prev]);
      setSelectedAnalysis(newAnalysis);
      toast.success("Marktpreis-Analyse abgeschlossen!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analyse fehlgeschlagen");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with vehicle info and action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Marktpreis-Analyse</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {vehicleMake} {vehicleModel} ({vehicleYear})
            {vehicleFactoryCode && ` · ${vehicleFactoryCode}`}
            {vehicleMileageKm != null && ` · ${vehicleMileageKm.toLocaleString("de-DE")} km`}
          </p>
        </div>
        <Button onClick={startAnalysis} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analysiere...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              {analyses.length === 0 ? "Analyse starten" : "Neue Analyse"}
            </>
          )}
        </Button>
      </div>

      {/* Loading state with progress hint */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <p className="font-medium text-sm">Marktdaten werden durchsucht...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  mobile.de, Classic Trader und eBay werden durchsucht. Dies kann bis zu 15 Sekunden dauern.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && analyses.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
              <div>
                <p className="font-medium text-sm">Noch keine Analyse durchgeführt</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Starten Sie eine Marktpreis-Analyse, um den aktuellen Wert Ihres Fahrzeugs einzuschätzen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!isLoading && selectedAnalysis && (
        <AnalysisResultView analysis={selectedAnalysis} />
      )}

      {/* History */}
      {analyses.length > 1 && (
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground w-full">
              <Clock className="h-4 w-4 mr-2" />
              Frühere Analysen ({analyses.length})
              {historyOpen ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-1 mt-2">
              {analyses.map((a) => (
                <HistoryItem
                  key={a.id}
                  analysis={a}
                  isSelected={selectedAnalysis?.id === a.id}
                  onSelect={() => setSelectedAnalysis(a)}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
