"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bell, Menu, LogOut, Crown, Trash2, Settings, Store, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notification-bell";
import { PendingRequestsBell } from "@/components/pending-requests-bell";
import { LogoutButton } from "@/components/logout-button";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { useSubscription } from "@/hooks/use-subscription";

interface MobileBottomNavProps {
  /**
   * Zeigt den Navigationspunkt „Werkstatt" (PROJ-37).
   *
   * Kommt serverseitig von der jeweiligen Seite (QA BUG-7).
   */
  hasWorkshopAccess?: boolean;
  /** Zeigt den Navigationspunkt „Bestand" (PROJ-38) — ebenfalls serverseitig */
  isDealer?: boolean;
}

export function MobileBottomNav({
  hasWorkshopAccess = false,
  isDealer = false,
}: MobileBottomNavProps = {}) {
  const pathname = usePathname();
  const { isPremium, isTrial } = useSubscription();

  const isDashboard = pathname === "/dashboard";
  const isVehicle = pathname.startsWith("/vehicles");
  const isSettings = pathname === "/settings";
  const isWorkshop = pathname === "/werkstatt";
  const isBestand = pathname === "/bestand";

  /**
   * Wie viele Zusatzbereiche dieser Nutzer hat — und wo sie hingehören.
   *
   * Die Leiste fasst höchstens fünf Einträge, sonst bleibt bei 360 px keine
   * lesbare Beschriftung übrig (QA BUG-8). Daraus folgt eine einfache Regel:
   *
   *   ein Zusatzbereich  → er steht in der Leiste, Einstellungen weicht ins Menü
   *   zwei Zusatzbereiche → beide wandern ins Menü, Einstellungen bleibt
   *
   * Wer beide Rollen hat, arbeitet ohnehin fortgeschritten; ein Menüklick ist
   * zumutbarer als drei unleserlich beschnittene Beschriftungen.
   */
  const zusatzbereiche = [hasWorkshopAccess, isDealer].filter(Boolean).length;
  const zusatzInLeiste = zusatzbereiche === 1;
  const zusatzImMenue = zusatzbereiche > 1;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background md:hidden">
      <div className="flex items-center h-14">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium transition-colors ${
            isDashboard ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </Link>

        {/* Werkstatt — nur bei Werkstatt-Rolle an mindestens einem Fahrzeug */}
        {hasWorkshopAccess && zusatzInLeiste && (
          <Link
            href="/werkstatt"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium transition-colors ${
              isWorkshop ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Wrench className="h-5 w-5" />
            Werkstatt
          </Link>
        )}

        {/* Bestand — nur für gewerblich erklärte Nutzer */}
        {isDealer && zusatzInLeiste && (
          <Link
            href="/bestand"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium transition-colors ${
              isBestand ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Store className="h-5 w-5" />
            Bestand
          </Link>
        )}

        {/* Einstellungen — weicht dem einen Zusatzbereich ins Menü (QA BUG-8):
            Sechs gleich breite Einträge lassen bei 360 px rund 60 px je
            Beschriftung, und „Einstellungen" passt dort nicht mehr. */}
        {!zusatzInLeiste && (
          <Link
            href="/settings"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium transition-colors ${
              isSettings ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Settings className="h-5 w-5" />
            Einstellungen
          </Link>
        )}

        {/* Pending Requests — only renders when there are open requests */}
        <PendingRequestsBell mobileLabel="Anfragen" />

        {/* Notifications */}
        <div className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium text-muted-foreground [&_button]:h-5 [&_button]:w-5">
          <NotificationBell />
          <span>Meldungen</span>
        </div>

        {/* Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-medium text-muted-foreground"
            >
              <Menu className="h-5 w-5" />
              Menü
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Menü</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-1">
              {isPremium && (
                <div className="px-3 pb-3">
                  <Badge
                    className={`text-xs ${
                      isTrial
                        ? "bg-amber-100 text-amber-700"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    {isTrial ? "Trial" : "Premium"}
                  </Badge>
                </div>
              )}
              {/* Was der Leiste gewichen ist, muss hier erreichbar sein. */}
              {zusatzImMenue && hasWorkshopAccess && (
                <Link
                  href="/werkstatt"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
                >
                  <Wrench className="h-4 w-4" />
                  Werkstatt
                </Link>
              )}
              {zusatzImMenue && isDealer && (
                <Link
                  href="/bestand"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
                >
                  <Store className="h-4 w-4" />
                  Bestand
                </Link>
              )}
              {zusatzInLeiste && (
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
                >
                  <Settings className="h-4 w-4" />
                  Einstellungen
                </Link>
              )}
              <div className="px-1">
                <LogoutButton />
              </div>
              <div className="px-1">
                <DeleteAccountButton />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {/* Safe area spacing for devices with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
