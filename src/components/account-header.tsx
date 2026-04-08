"use client";

import Link from "next/link";
import { BrandLogoWithText } from "@/components/brand-logo";
import { LogoutButton } from "@/components/logout-button";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AccountHeaderProps {
  email: string;
}

export function AccountHeader({ email }: AccountHeaderProps) {
  return (
    <header className="border-b border-border/40 bg-background">
      <div className="container mx-auto flex h-14 items-center justify-between px-6 lg:px-8">
        <Link href="/dashboard" className="hover:opacity-80 transition-opacity">
          <BrandLogoWithText />
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">
                {email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
