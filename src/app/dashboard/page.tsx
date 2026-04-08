import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/components/logout-button";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { VehicleCard, AddVehicleCard } from "@/components/vehicle-card";
import { BrandLogoWithText } from "@/components/brand-logo";
import { Car } from "lucide-react";
import type { VehicleWithImages } from "@/lib/validations/vehicle";
import { ROLE_LABELS, type MemberRole } from "@/lib/validations/member";

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

  const sharedVehicles = (memberships ?? [])
    .filter((m) => m.vehicles)
    .map((m) => ({
      vehicle: m.vehicles as unknown as VehicleWithImages,
      role: m.role as MemberRole,
    }));

  return (
    <div className="bg-muted/40">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <BrandLogoWithText />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm">
                {user.email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <LogoutButton />
              </DropdownMenuItem>
              <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
                <DeleteAccountButton />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
            <AddVehicleCard />
          </div>
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
                  <VehicleCard vehicle={vehicle} />
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
      </main>
    </div>
  );
}
