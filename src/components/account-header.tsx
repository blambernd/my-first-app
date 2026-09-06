"use client";

import Link from "next/link";
import { BrandLogoWithText } from "@/components/brand-logo";
import { LogoutButton } from "@/components/logout-button";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { NotificationBell } from "@/components/notification-bell";
import { PendingRequestsBell } from "@/components/pending-requests-bell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSubscription } from "@/hooks/use-subscription";
import { Crown, Settings, Wrench } from "lucide-react";

interface AccountHeaderProps {
  email: string;
  /**
   * Zeigt den Navigationspunkt „Werkstatt" (PROJ-37).
   *
   * Kommt serverseitig von der jeweiligen Seite, nicht aus einer eigenen
   * Abfrage im Browser (QA BUG-7).
   */
  hasWorkshopAccess?: boolean;
}

export function AccountHeader({ email, hasWorkshopAccess = false }: AccountHeaderProps) {
  const { data: sub, isPremium, isTrial } = useSubscription();

  return (
    <header className="border-b border-border/40 bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-6 lg:px-8">
        <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
          <BrandLogoWithText />
        </Link>
        <div className="flex items-center gap-2">
          {hasWorkshopAccess && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex text-sm gap-2"
            >
              <Link href="/werkstatt">
                <Wrench className="h-4 w-4" />
                Werkstatt
              </Link>
            </Button>
          )}
          <div className="hidden md:flex items-center gap-1">
            <PendingRequestsBell />
            <NotificationBell />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden md:inline-flex text-sm text-muted-foreground gap-2">
                {isPremium && (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 ${
                      isTrial
                        ? "bg-amber-100 text-amber-700"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    <Crown className="h-2.5 w-2.5 mr-0.5" />
                    {isTrial ? "Trial" : "Premium"}
                  </Badge>
                )}
                {email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sub && (
                <>
                  <DropdownMenuItem className="text-xs text-muted-foreground pointer-events-none">
                    Plan: {sub.plan === "trial" ? "Trial" : sub.plan === "premium" ? "Premium" : "Free"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Einstellungen
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <LogoutButton />
              </DropdownMenuItem>
              <DeleteAccountButton />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
