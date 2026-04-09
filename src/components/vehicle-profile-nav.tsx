"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Clock, FileText, Car, Workflow, Lock } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";

interface VehicleProfileNavProps {
  vehicleId: string;
  isOwner?: boolean;
}

const navItems = [
  {
    label: "Übersicht",
    href: "",
    icon: Car,
  },
  {
    label: "Scheckheft",
    href: "/scheckheft",
    icon: BookOpen,
  },
  {
    label: "Historie",
    href: "/historie",
    icon: Clock,
  },
  {
    label: "Dokumente",
    href: "/dokumente",
    icon: FileText,
  },
  // Ersatzteil-Suche vorübergehend deaktiviert (Ergebnisqualität)
  // {
  //   label: "Ersatzteile",
  //   href: "/ersatzteile",
  //   icon: Cog,
  // },
  {
    label: "Verkaufsassistent",
    href: "/verkaufsassistent",
    icon: Workflow,
    premium: true,
  },
];

export function VehicleProfileNav({ vehicleId }: VehicleProfileNavProps) {
  const pathname = usePathname();
  const basePath = `/vehicles/${vehicleId}`;
  const { isPremium, loading } = useSubscription();
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Auto-scroll active tab into view on mobile
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav className="flex gap-1 py-2 -mx-2 overflow-x-auto scrollbar-hide">
      {navItems.map((item) => {
        const fullPath = `${basePath}${item.href}`;
        const isActive =
          item.href === ""
            ? pathname === basePath
            : pathname.startsWith(fullPath);
        const Icon = item.icon;
        const showLock = "premium" in item && item.premium && !loading && !isPremium;

        return (
          <Link
            key={item.href}
            ref={isActive ? activeRef : undefined}
            href={fullPath}
            className={`flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? "bg-primary/8 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
            {showLock ? (
              <Lock className="h-3 w-3 text-amber-500" />
            ) : (
              "premium" in item && item.premium && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Premium
                </Badge>
              )
            )}
          </Link>
        );
      })}
    </nav>
  );
}
