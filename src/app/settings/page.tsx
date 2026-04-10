import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { AccountHeader } from "@/components/account-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { NotificationSettings } from "@/components/notification-settings";
import { LogoutButton } from "@/components/logout-button";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <AccountHeader email={user.email ?? ""} />
      <main className="container mx-auto px-6 lg:px-8 py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Dashboard
          </Link>
          <h1 className="text-2xl font-bold mt-2">Einstellungen</h1>
        </div>

        <div className="space-y-6">
          {/* Push Notification Settings */}
          <NotificationSettings />

          {/* Account Actions */}
          <div className="border rounded-lg p-4 space-y-3">
            <h2 className="text-base font-medium">Konto</h2>
            <div className="flex flex-col gap-1">
              <div className="rounded-md hover:bg-accent transition-colors">
                <LogoutButton />
              </div>
              <div className="rounded-md hover:bg-accent transition-colors">
                <DeleteAccountButton />
              </div>
            </div>
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
