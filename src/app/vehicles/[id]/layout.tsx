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
import { SiteFooter } from "@/components/site-footer";
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
    // `data-app-shell` markiert eine Seite mit Seitenleiste. Der Footer aus
    // dem Wurzel-Layout hängt am `body` und damit außerhalb dieses Providers —
    // die Seitenleiste ist `fixed` und legte sich über seine linken 127 px.
    // Statt die Breite an zwei Stellen zu pflegen, wird der äußere Footer auf
    // solchen Seiten ausgeblendet (globals.css) und hier im Inhaltsfluss
    // ausgegeben, wo er sich von selbst richtig einordnet — auch beim
    // Einklappen und auf dem Smartphone.
    <SidebarProvider defaultOpen={sidebarOffen} data-app-shell>
      <VehicleSidebar
        vehicleId={id}
        isOwner={isOwner}
        vehicles={switchableVehicles}
      />

      <SidebarInset className="bg-background min-w-0">
        <AccountHeader email={user.email || ""} />

        <div className="border-b border-border/30">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* py-2.5 statt py-4: Der Kopf trägt nur eine Zeile — Name,
                Erstzulassung und zwei Bedienelemente. Mehr Polsterung schob
                den Inhalt ohne Gewinn nach unten. */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                {/* Auf schmalen Bildschirmen der einzige Weg in die
                    Fahrzeugnavigation — sie liegt dort als Panel überlagert. */}
                <SidebarTrigger className="-ml-1" />
                <h1 className="text-xl font-medium tracking-tight truncate">
                  {typedVehicle.make} {typedVehicle.model}
                  {/* Trennzeichen und zweistellige Tage: Ohne beides las sich
                      die Zeile als „SL380 1.1.1980" — die Modellnummer und das
                      Datum flossen ineinander. */}
                  <span className="text-muted-foreground font-light ml-2">
                    <span aria-hidden="true" className="mr-2">
                      ·
                    </span>
                    {typedVehicle.first_registration_date
                      ? new Date(
                          typedVehicle.first_registration_date
                        ).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
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
          {/* Oben knapper (vorher py-6 sm:py-10): Zwischen Fahrzeugkopf und
              erster Überschrift standen 57 px, ohne dass die Trennung dadurch
              deutlicher wurde — die Linie leistet das bereits.
              Unten bleibt viel Luft, weil dort auf dem Smartphone die untere
              Leiste liegt. */}
          <div className="pt-4 sm:pt-6 pb-20 md:pb-10">{children}</div>
        </div>

        <SiteFooter />

        <MobileBottomNav />
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
