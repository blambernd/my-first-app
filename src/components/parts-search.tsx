"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  Bell,
  Filter,
  Loader2,
  Cog,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CreateAlertDialog } from "@/components/create-alert-dialog";
import {
  partsSearchSchema,
  PART_CONDITIONS,
  PLATFORMS,
  formatPrice,
  type PartsSearchFormData,
  type PartsSearchResult,
  type PartGroup,
  type PartListing,
  type PlatformId,
} from "@/lib/validations/parts";

const CONDITION_COLORS: Record<string, string> = {
  new: "bg-green-100 text-green-800",
  used: "bg-amber-100 text-amber-800",
  unknown: "bg-gray-100 text-gray-800",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Neu",
  used: "Gebraucht",
  unknown: "Unbekannt",
};

interface PartsSearchProps {
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
}

function ListingCard({ listing }: { listing: PartListing }) {
  return (
    <a
      href={listing.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 transition-colors group"
    >
      {listing.imageUrl ? (
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="w-16 h-16 rounded object-cover shrink-0 bg-muted"
        />
      ) : (
        <div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0">
          <Cog className="h-6 w-6 text-muted-foreground/40" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {listing.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge
            className={`${CONDITION_COLORS[listing.condition]} border-0 text-xs`}
          >
            {CONDITION_LABELS[listing.condition]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {listing.platformLabel}
          </span>
          {listing.seller && (
            <span className="text-xs text-muted-foreground truncate">
              {listing.seller}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-semibold text-sm">
          {listing.price != null ? formatPrice(listing.price) : "Preis n.A."}
        </span>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  );
}

function ResultGroup({ group }: { group: PartGroup }) {
  const [expanded, setExpanded] = useState(group.listings.length <= 3);
  const visibleListings = expanded
    ? group.listings
    : group.listings.slice(0, 3);

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{group.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {group.listings.length}{" "}
              {group.listings.length === 1 ? "Angebot" : "Angebote"}
            </Badge>
            {group.lowestPrice != null && (
              <span className="text-sm font-semibold text-primary">
                ab {formatPrice(group.lowestPrice)}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        <div className="divide-y">
          {visibleListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
        {group.listings.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-center text-xs text-primary hover:underline mt-2 flex items-center justify-center gap-1"
          >
            {expanded ? (
              <>
                Weniger anzeigen <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                {group.listings.length - 3} weitere anzeigen{" "}
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="py-3 px-4">
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 space-y-3">
            {[1, 2].map((j) => (
              <div key={j} className="flex items-start gap-3 p-3">
                <Skeleton className="w-16 h-16 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PartsSearch({
  vehicleId,
  vehicleMake,
  vehicleModel,
  vehicleYear,
}: PartsSearchProps) {
  const [results, setResults] = useState<PartsSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertPrefill, setAlertPrefill] = useState("");

  const form = useForm<PartsSearchFormData>({
    resolver: zodResolver(partsSearchSchema) as Resolver<PartsSearchFormData>,
    defaultValues: {
      query: "",
      condition: "all",
      minPrice: "",
      maxPrice: "",
      platforms: PLATFORMS.map((p) => p.value),
    },
  });

  const handleSearch = async (data: PartsSearchFormData, page = 1) => {
    setIsSearching(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        query: data.query,
        make: vehicleMake,
        model: vehicleModel,
        year: String(vehicleYear),
        condition: data.condition,
        page: String(page),
      });

      if (data.minPrice) {
        params.set("minPrice", String(data.minPrice));
      }
      if (data.maxPrice) {
        params.set("maxPrice", String(data.maxPrice));
      }
      if (data.platforms && data.platforms.length > 0) {
        params.set("platforms", data.platforms.join(","));
      }

      const response = await fetch(
        `/api/vehicles/${vehicleId}/parts/search?${params.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || "Fehler bei der Ersatzteil-Suche"
        );
      }

      const result: PartsSearchResult = await response.json();
      setResults(result);

      if (result.platformErrors.length > 0) {
        toast.warning(
          `${result.platformErrors.length} Plattform(en) nicht erreichbar`,
          {
            description: result.platformErrors
              .map((e) => e.platform)
              .join(", "),
          }
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Fehler bei der Ersatzteil-Suche"
      );
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = (data: PartsSearchFormData) => {
    handleSearch(data, 1);
  };

  const handlePageChange = (page: number) => {
    handleSearch(form.getValues(), page);
  };

  const handleCreateAlert = (query?: string) => {
    setAlertPrefill(query || form.getValues("query"));
    setAlertDialogOpen(true);
  };

  return (
    <div>
      {/* Vehicle context */}
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <Cog className="h-4 w-4" />
        <span>
          Ersatzteile für{" "}
          <span className="font-medium text-foreground">
            {vehicleMake} {vehicleModel}
          </span>{" "}
          ({vehicleYear})
        </span>
      </div>

      {/* Search form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="flex gap-2">
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Ersatzteil suchen, z.B. Bremstrommel, Zündkerze..."
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-1.5 hidden sm:inline">Suchen</span>
            </Button>
          </div>

          {/* Collapsible filters */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-muted-foreground"
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                Filter
                {filtersOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 ml-1" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Card>
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Zustand</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PART_CONDITIONS.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="minPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Min. Preis (€)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            className="h-9"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Max. Preis (€)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Kein Limit"
                            className="h-9"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="sm:col-span-3">
                    <FormField
                      control={form.control}
                      name="platforms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Plattformen</FormLabel>
                          <div className="flex flex-wrap gap-3">
                            {PLATFORMS.map((platform) => (
                              <label
                                key={platform.value}
                                className="flex items-center gap-1.5 text-sm"
                              >
                                <Checkbox
                                  checked={
                                    field.value?.includes(platform.value) ??
                                    false
                                  }
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([
                                        ...current,
                                        platform.value,
                                      ]);
                                    } else {
                                      field.onChange(
                                        current.filter(
                                          (v) => v !== platform.value
                                        )
                                      );
                                    }
                                  }}
                                />
                                {platform.label}
                              </label>
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </form>
      </Form>

      {/* Action bar */}
      <div className="flex items-center justify-between mt-4 mb-4">
        <div className="text-sm text-muted-foreground">
          {results &&
            `${results.totalResults} Ergebnis${results.totalResults !== 1 ? "se" : ""}`}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCreateAlert()}
            disabled={!form.getValues("query")}
          >
            <Bell className="h-3.5 w-3.5 mr-1.5" />
            Alert erstellen
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/vehicles/${vehicleId}/ersatzteile/alerts`}>
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              Meine Alerts
            </Link>
          </Button>
        </div>
      </div>

      {/* Results */}
      {isSearching && <SearchSkeleton />}

      {!isSearching && results && results.groups.length > 0 && (
        <div className="space-y-4">
          {results.groups.map((group, idx) => (
            <ResultGroup key={idx} group={group} />
          ))}

          {/* Pagination */}
          {results.totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                {results.page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(results.page - 1);
                      }}
                    />
                  </PaginationItem>
                )}
                {Array.from({ length: results.totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === results.totalPages ||
                      Math.abs(p - results.page) <= 1
                  )
                  .map((p, idx, arr) => (
                    <PaginationItem key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <PaginationLink
                        href="#"
                        isActive={p === results.page}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(p);
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                {results.page < results.totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(results.page + 1);
                      }}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isSearching && hasSearched && results?.groups.length === 0 && (
        <div className="text-center py-12">
          <Cog className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-4">
            Keine Ersatzteile gefunden.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCreateAlert()}
          >
            <Bell className="h-3.5 w-3.5 mr-1.5" />
            Such-Alert erstellen
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Wir benachrichtigen dich, sobald passende Teile gefunden werden.
          </p>
        </div>
      )}

      {/* Initial state */}
      {!isSearching && !hasSearched && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            Suche nach Ersatzteilen für dein Fahrzeug.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Wir durchsuchen eBay Kleinanzeigen, Mobile.de, Oldtimer-Markt.de
            und Classic-Trader.
          </p>
        </div>
      )}

      {/* Platform errors */}
      {!isSearching &&
        results &&
        results.platformErrors.length > 0 && (
          <div className="mt-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-800">
                Einige Plattformen waren nicht erreichbar:
              </p>
              <ul className="text-amber-700 mt-1">
                {results.platformErrors.map((e, i) => (
                  <li key={i}>
                    {e.platform}: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      {/* Create Alert Dialog */}
      <CreateAlertDialog
        vehicleId={vehicleId}
        vehicleMake={vehicleMake}
        vehicleModel={vehicleModel}
        vehicleYear={vehicleYear}
        prefillQuery={alertPrefill}
        open={alertDialogOpen}
        onOpenChange={setAlertDialogOpen}
      />
    </div>
  );
}
