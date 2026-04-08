"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Clock, FileText, Car, Cog, Share2, TrendingUp, Tag } from "lucide-react";

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
  {
    label: "Ersatzteile",
    href: "/ersatzteile",
    icon: Cog,
  },
  {
    label: "Marktpreis",
    href: "/marktpreis",
    icon: TrendingUp,
  },
  {
    label: "Kurzprofil",
    href: "/kurzprofil",
    icon: Share2,
  },
  {
    label: "Verkaufen",
    href: "/verkaufen",
    icon: Tag,
  },
];

export function VehicleProfileNav({ vehicleId }: VehicleProfileNavProps) {
  const pathname = usePathname();
  const basePath = `/vehicles/${vehicleId}`;

  const allItems = navItems;

  return (
    <nav className="flex gap-1 py-2 -mx-2 overflow-x-auto">
      {allItems.map((item) => {
        const fullPath = `${basePath}${item.href}`;
        const isActive =
          item.href === ""
            ? pathname === basePath
            : pathname.startsWith(fullPath);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={fullPath}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? "bg-primary/8 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
