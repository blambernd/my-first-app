import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccountHeader } from "@/components/account-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { VehicleCard, AddVehicleCard } from "@/components/vehicle-card";
import { PlanOverview } from "@/components/plan-overview";
import { ReferralCard } from "@/components/referral-card";
import { EventsOverview } from "@/components/events-overview";
import { PushOptInBanner } from "@/components/push-opt-in-banner";
import { Car, Wrench } from "lucide-react";
import type { VehicleWithImages } from "@/lib/validations/vehicle";
import { ROLE_LABELS, type MemberRole } from "@/lib/validations/member";
import { toCurrency } from "@/lib/currency";
import {
  getEffectivePlan,
  canAddVehicle,
  hasPremiumAccess,
  isBetaMode,
} from "@/lib/subscription";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Own vehicles
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*, vehicle_images(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const typedVehicles = (vehicles ?? []) as VehicleWithImages[];

  // Shared vehicles (where user is a member)
  const { data: memberships } = await supabase
    .from("vehicle_members")
    .select("role, vehicles(*, vehicle_images(*))")
    .eq("user_id", user.id)
    .limit(50);

  const allMemberships = (memberships ?? [])
    .filter((m) => m.vehicles)
    .map((m) => ({
      vehicle: m.vehicles as unknown as VehicleWithImages,
      role: m.role as MemberRole,
    }));

  // PROJ-37: Kundenfahrzeuge leben im Werkstattbereich und nicht zusätzlich
  // hier — jedes Fahrzeug soll an genau einer Stelle stehen. Damit sie nicht
  // scheinbar verschwinden, steht unten eine Verweiskachel.
  const sharedVehicles = allMemberships.filter((m) => m.role !== "werkstatt");
  const workshopVehicleCount = allMemberships.filter(
    (m) => m.role === "werkstatt"
  ).length;

  // Get subscription for vehicle limit check
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, trial_end, referral_bonus_until")
    .eq("user_id", user.id)
    .single();

  const effectivePlan = subscription ? getEffectivePlan(subscription) : isBetaMode ? "premium" : "free";
  const canAdd = canAddVehicle(effectivePlan, typedVehicles.length);

  // PROJ-36: Die Währung steht nur an den Kacheln, wenn sie tatsächlich etwas
  // unterscheidet. Wer alles in Euro führt — der Normalfall — soll neben jedem
  // Fahrzeug kein „EUR" lesen müssen, das nichts aussagt. Geteilte Fahrzeuge
  // zählen mit: Auch sie können in einer anderen Währung geführt sein.
  const waehrungen = new Set(
    [...typedVehicles, ...allMemberships.map((s) => s.vehicle)].map((v) =>
      toCurrency(v.currency)
    )
  );
  const waehrungenGemischt = waehrungen.size > 1;
  const premiumActive = hasPremiumAccess(effectivePlan);

  return (
    <div className="bg-muted/40">
      <AccountHeader
        email={user.email || ""}
        hasWorkshopAccess={workshopVehicleCount > 0}
      />

      <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Meine Fahrzeuge</h2>
        </div>

        {typedVehicles.length === 0 ? (
          <div className="text-center py-16">
            <Car className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Noch keine Fahrzeuge</h3>
            <p className="text-muted-foreground mb-6">
              Lege jetzt deinen ersten Oldtimer an und starte mit der Dokumentation.
            </p>
            <Button asChild>
              <Link href="/vehicles/new">Erstes Fahrzeug anlegen</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {typedVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                hasPremium={premiumActive}
                showCurrency={waehrungenGemischt}
              />
            ))}
            {canAdd && <AddVehicleCard />}
          </div>
        )}

        {/* Push notification opt-in */}
        <div className="mt-6">
          <PushOptInBanner />
        </div>

        {/* PROJ-37: Verweis auf den Werkstattbereich */}
        {workshopVehicleCount > 0 && (
          <Link
            href="/werkstatt"
            className="mt-6 flex items-center gap-4 rounded-lg border bg-background p-4 transition-colors hover:bg-muted/50"
          >
            <Wrench className="h-8 w-8 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="font-medium">
                {workshopVehicleCount === 1
                  ? "1 Kundenfahrzeug im Werkstattbereich"
                  : `${workshopVehicleCount} Kundenfahrzeuge im Werkstattbereich`}
              </p>
              <p className="text-sm text-muted-foreground">
                Anstehende Arbeiten und Schnellzugriff auf das Scheckheft
              </p>
            </div>
          </Link>
        )}

        {/* Shared vehicles */}
        {sharedVehicles.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6 mt-12">
              <h2 className="text-2xl font-bold">Geteilte Fahrzeuge</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sharedVehicles.map(({ vehicle, role }) => (
                <div key={vehicle.id} className="relative">
                  <VehicleCard vehicle={vehicle} showCurrency={waehrungenGemischt} />
                  <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 text-xs"
                  >
                    {ROLE_LABELS[role]}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}

        </div>

        {/* Sidebar: Plan overview + Referral (hidden on mobile — available in settings) */}
        <div className="hidden lg:block space-y-4">
          <PlanOverview />
          <ReferralCard />
        </div>
        </div>

        {/* Events Overview - full width */}
        <EventsOverview />
      </main>
      <MobileBottomNav hasWorkshopAccess={workshopVehicleCount > 0} />
    </div>
  );
}
