"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase";

export function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full text-left px-2 py-1.5 text-sm flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Abmelden
    </button>
  );
}
