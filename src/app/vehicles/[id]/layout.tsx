import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { AccountHeader } from "@/components/account-header";
import { DeleteVehicleButton } from "@/components/delete-vehicle-button";
import { LeaveVehicleButton } from "@/components/leave-vehicle-button";
import { VehicleProfileNav } from "@/components/vehicle-profile-nav";
import { ProfileStatusToggle } from "@/components/profile-status-toggle";
import { Pencil, Shield, ArrowRightLeft } from "lucide-react";
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

  return (
    <div className="bg-background">
      <AccountHeader email={user.email || ""} />

      {/* Vehicle identity + actions + nav */}
      <div className="border-b border-border/30">
        <div className="container mx-auto px-6 lg:px-8 max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-5 pb-1">
            <h1 className="text-xl font-medium tracking-tight">
              {typedVehicle.make} {typedVehicle.model}
              <span className="text-muted-foreground font-light ml-2">
                {typedVehicle.first_registration_date
                  ? new Date(typedVehicle.first_registration_date).toLocaleDateString("de-DE")
                  : typedVehicle.year}
              </span>
            </h1>
            {isOwner ? (
              <div className="flex items-center gap-1 flex-wrap">
                <ProfileStatusToggle vehicleId={id} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-8 text-xs"
                  asChild
                >
                  <Link href={`/vehicles/${id}/transfer`}>
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                    Transfer
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-8 text-xs"
                  asChild
                >
                  <Link href={`/vehicles/${id}/mitglieder`}>
                    <Shield className="h-3.5 w-3.5 mr-1" />
                    Freigabe
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-8 text-xs"
                  asChild
                >
                  <Link href={`/vehicles/${id}/edit`}>
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Bearbeiten
                  </Link>
                </Button>
                <DeleteVehicleButton
                  vehicleId={id}
                  vehicleName={`${typedVehicle.make} ${typedVehicle.model}`}
                />
              </div>
            ) : (
              <LeaveVehicleButton
                vehicleId={id}
                vehicleName={`${typedVehicle.make} ${typedVehicle.model}`}
              />
            )}
          </div>
          <VehicleProfileNav vehicleId={id} isOwner={isOwner} />
        </div>
      </div>

      <main className="container mx-auto px-6 lg:px-8 max-w-5xl">
        <div className="py-8 sm:py-10">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}
