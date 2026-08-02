import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase-server";
import { AccountHeader } from "@/components/account-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { LeaveVehicleButton } from "@/components/leave-vehicle-button";
import { VehicleSidebar } from "@/components/vehicle-sidebar";
import { VehicleHeaderActions } from "@/components/vehicle-header-actions";
import type { SwitchableVehicle } from "@/components/vehicle-switcher";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import type { VehicleWithImages } from "@/lib/validations/vehicle";
import type { MemberRole } from "@/lib/validations/member";

interface VehicleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function VehicleLayout({
  children,
  params,
}: VehicleLayoutProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // First try: user is the owner
  const { data: ownedVehicle } = await supabase
    .from("vehicles")
    .select("*, vehicle_images(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  let typedVehicle: VehicleWithImages;
  let userRole: MemberRole;

  if (ownedVehicle) {
    typedVehicle = ownedVehicle as VehicleWithImages;
    userRole = "besitzer";
  } else {
    // Second try: user is a member
    const { data: membership } = await supabase
      .from("vehicle_members")
      .select("role, vehicles(*, vehicle_images(*))")
      .eq("vehicle_id", id)
      .eq("user_id", user.id)
      .single();

    if (!membership?.vehicles) {
      notFound();
    }

    typedVehicle = membership.vehicles as unknown as VehicleWithImages;
    userRole = membership.role as MemberRole;
  }

  const isOwner = userRole === "besitzer";

  // Fahrzeugliste für den Wechsler — serverseitig, weil Fahrzeug und Rolle
  // hier ohnehin geladen werden. So steht der Name sofort da, statt erst als
  // Platzhalter zu erscheinen und nachgeladen zu werden.
  const [{ data: eigene }, { data: geteilte }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, make, model")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("vehicle_members")
      .select("vehicles(id, make, model)")
      .eq("user_id", user.id),
  ]);

  const switchableVehicles: SwitchableVehicle[] = [
    ...(eigene ?? []).map((v) => ({
      id: v.id as string,
      make: v.make as string,
      model: v.model as string,
      shared: false,
    })),
    ...(geteilte ?? [])
      .map((m) => m.vehicles as unknown as { id: string; make: string; model: string } | null)
      .filter((v): v is { id: string; make: string; model: string } => Boolean(v))
      .map((v) => ({ id: v.id, make: v.make, model: v.model, shared: true })),
  ];

  // Der Klappzustand steht im Cookie, nicht im Browser-Speicher: Der Server
  // kennt ihn dadurch schon beim Ausliefern und baut die Seite gleich richtig
  // auf. Über localStorage entstünde ein sichtbares Zusammenklappen nach dem
  // Laden — dieselbe Ursache wie beim Hydration-Fehler vom 2026-08-02.
  const cookieStore = await cookies();
  const sidebarOffen = cookieStore.get("sidebar_state")?.value !== "false";

  const vehicleName = `${typedVehicle.make} ${typedVehicle.model}`;

  return (
    <SidebarProvider defaultOpen={sidebarOffen}>
      <VehicleSidebar
        vehicleId={id}
        isOwner={isOwner}
        vehicles={switchableVehicles}
      />

      <SidebarInset className="bg-background min-w-0">
        <AccountHeader email={user.email || ""} />

        <div className="border-b border-border/30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-4">
              <div className="flex items-center gap-2 min-w-0">
                {/* Auf schmalen Bildschirmen der einzige Weg in die
                    Fahrzeugnavigation — sie liegt dort als Panel überlagert. */}
                <SidebarTrigger className="-ml-1" />
                <h1 className="text-xl font-medium tracking-tight truncate">
                  {typedVehicle.make} {typedVehicle.model}
                  <span className="text-muted-foreground font-light ml-2">
                    {typedVehicle.first_registration_date
                      ? new Date(
                          typedVehicle.first_registration_date
                        ).toLocaleDateString("de-DE")
                      : typedVehicle.year}
                  </span>
                </h1>
              </div>

              {isOwner ? (
                <VehicleHeaderActions vehicleId={id} vehicleName={vehicleName} />
              ) : (
                <LeaveVehicleButton vehicleId={id} vehicleName={vehicleName} />
              )}
            </div>
          </div>
        </div>

        {/* Bewusst ein div: SidebarInset rendert selbst bereits ein <main>.
            Zwei verschachtelte <main> sind ungültiges HTML und melden
            Screenreadern zwei Hauptinhalte. */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6 sm:py-10 pb-20 md:pb-10">{children}</div>
        </div>

        <MobileBottomNav />
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
