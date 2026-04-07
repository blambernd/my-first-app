import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { BrandLogoWithText } from "@/components/brand-logo";
import { DeleteVehicleButton } from "@/components/delete-vehicle-button";
import { VehicleProfileNav } from "@/components/vehicle-profile-nav";
import { Pencil, Shield } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="container mx-auto flex h-14 items-center justify-between px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="hover:opacity-80 transition-opacity"
          >
            <BrandLogoWithText />
          </Link>
          {isOwner && (
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href={`/vehicles/${id}/mitglieder`}>
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  Freigabe
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href={`/vehicles/${id}/edit`}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Bearbeiten
                </Link>
              </Button>
              <DeleteVehicleButton
                vehicleId={id}
                vehicleName={`${typedVehicle.make} ${typedVehicle.model}`}
              />
            </div>
          )}
        </div>
      </header>

      {/* Compact vehicle identity + nav */}
      <div className="border-b border-border/30">
        <div className="container mx-auto px-6 lg:px-8 max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-5 pb-1">
            <div>
              <h1 className="text-xl font-medium tracking-tight">
                {typedVehicle.make} {typedVehicle.model}
                <span className="text-muted-foreground font-light ml-2">
                  {typedVehicle.year}
                </span>
              </h1>
            </div>
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
