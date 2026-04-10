"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bell, Menu, LogOut, Crown, Trash2, Settings } from "lucide-react";
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
import { LogoutButton } from "@/components/logout-button";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { useSubscription } from "@/hooks/use-subscription";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isPremium, isTrial } = useSubscription();

  const isDashboard = pathname === "/dashboard";
  const isVehicle = pathname.startsWith("/vehicles");
  const isSettings = pathname === "/settings";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background md:hidden">
      <div className="flex items-center justify-around h-14">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] h-full px-2 text-[10px] font-medium transition-colors ${
            isDashboard ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </Link>

        {/* Einstellungen */}
        <Link
          href="/settings"
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[64px] h-full px-2 text-[10px] font-medium transition-colors ${
            isSettings ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Settings className="h-5 w-5" />
          Einstellungen
        </Link>

        {/* Notifications */}
        <div className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] h-full px-2 text-[10px] font-medium text-muted-foreground">
          <NotificationBell />
          <span className="-mt-0.5">Meldungen</span>
        </div>

        {/* Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] h-full px-2 text-[10px] font-medium text-muted-foreground"
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
