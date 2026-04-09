"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Calendar,
  MapPin,
  ChevronDown,
  ExternalLink,
  Trophy,
  Store,
  Flag,
  Ticket,
  Loader2,
  Filter,
} from "lucide-react";

type EventCategory = "rallye" | "messe" | "regional";

interface EventItem {
  id: string;
  name: string;
  date_start: string;
  date_end: string | null;
  location: string;
  plz: string;
  category: EventCategory;
  description: string | null;
  entry_price: string | null;
  website_url: string | null;
  distance_km: number | null;
}

const CATEGORY_CONFIG: Record<
  EventCategory,
  { label: string; icon: typeof Trophy; color: string }
> = {
  rallye: { label: "Rallye", icon: Trophy, color: "bg-amber-100 text-amber-800" },
  messe: { label: "Messe", icon: Store, color: "bg-blue-100 text-blue-800" },
  regional: { label: "Regional", icon: Flag, color: "bg-green-100 text-green-800" },
};

const RADIUS_OPTIONS = [
  { value: "25", label: "25 km" },
  { value: "50", label: "50 km" },
  { value: "100", label: "100 km" },
  { value: "200", label: "200 km" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateRange(start: string, end: string | null): string {
  if (!end || end === start) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function EventCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </CardContent>
    </Card>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const config = CATEGORY_CONFIG[event.category];
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm leading-tight">{event.name}</h4>
          <Badge variant="secondary" className={`shrink-0 text-xs ${config.color}`}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDateRange(event.date_start, event.date_end)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>
              {event.location}
              {event.distance_km != null && (
                <span className="ml-1 text-xs text-muted-foreground/70">
                  ({Math.round(event.distance_km)} km)
                </span>
              )}
            </span>
          </div>
          {event.entry_price && (
            <div className="flex items-center gap-2">
              <Ticket className="h-3.5 w-3.5 shrink-0" />
              <span>{event.entry_price}</span>
            </div>
          )}
        </div>

        {event.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}

        {event.website_url && /^https?:\/\//i.test(event.website_url) && (
          <a
            href={event.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Website
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export function EventsOverview() {
  const [isOpen, setIsOpen] = useState(true);
  const [plz, setPlz] = useState("");
  const [radius, setRadius] = useState("50");
  const [categories, setCategories] = useState<EventCategory[]>([
    "rallye",
    "messe",
    "regional",
  ]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const isValidPlz = /^\d{5}$/.test(plz);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced auto-fetch: loads all events initially, filters by PLZ when entered
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const params = new URLSearchParams({
          categories: categories.join(","),
        });
        if (isValidPlz) {
          params.set("plz", plz);
          params.set("radius", radius);
        }
        const res = await fetch(`/api/events?${params}`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [plz, radius, categories, isValidPlz]);

  function toggleCategory(cat: EventCategory) {
    setCategories((prev) => {
      if (prev.includes(cat)) {
        // Keep at least one category
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  }

  // Client-side date filter
  const filteredEvents = events.filter((event) => {
    if (dateFrom && event.date_start < dateFrom) return false;
    if (dateTo && event.date_start > dateTo) return false;
    return true;
  });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 group cursor-pointer">
            <h2 className="text-2xl font-bold">Veranstaltungen</h2>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform ${
                isOpen ? "" : "-rotate-90"
              }`}
            />
          </button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        {/* Filters */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="PLZ eingeben"
                value={plz}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                  setPlz(val);
                }}
                className="w-32 text-sm"
              />
              <Select value={radius} onValueChange={setRadius}>
                <SelectTrigger className="w-28 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RADIUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG.rallye][]).map(
                ([key, config]) => {
                  const isActive = categories.includes(key);
                  return (
                    <Button
                      key={key}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCategory(key)}
                      className="text-xs"
                    >
                      <config.icon className="h-3.5 w-3.5 mr-1" />
                      {config.label}
                    </Button>
                  );
                }
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36 text-sm"
              placeholder="Von"
            />
            <span className="text-sm text-muted-foreground">–</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36 text-sm"
              placeholder="Bis"
            />
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="text-xs text-muted-foreground"
              >
                Zurücksetzen
              </Button>
            )}
          </div>
        </div>

        {/* Content */}

        {loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Veranstaltungen werden geladen...
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {!loading && hasSearched && filteredEvents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm">Keine Veranstaltungen gefunden.</p>
            <p className="text-xs mt-1">Versuche andere Filter oder einen größeren Umkreis.</p>
          </div>
        )}

        {!loading && filteredEvents.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground mb-2">
              {filteredEvents.length} Veranstaltung{filteredEvents.length !== 1 ? "en" : ""}
            </p>
            <ScrollArea className="h-[420px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              <ScrollBar />
            </ScrollArea>
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
