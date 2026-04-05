import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Pencil, Car } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { DeleteVehicleButton } from "@/components/delete-vehicle-button";
import type { VehicleWithImages } from "@/lib/validations/vehicle";

interface VehicleDetailPageProps {
  params: Promise<{ id: string }>;
}

function getImageUrl(storagePath: string, supabaseUrl: string): string {
  return `${supabaseUrl}/storage/v1/object/public/vehicle-images/${storagePath}`;
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, vehicle_images(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    notFound();
  }

  const typedVehicle = vehicle as VehicleWithImages;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const sortedImages = [...(typedVehicle.vehicle_images ?? [])].sort(
    (a, b) => a.position - b.position
  );
  const primaryImage = sortedImages.find((img) => img.is_primary) ?? sortedImages[0];

  const details = [
    { label: "Marke", value: typedVehicle.make },
    { label: "Modell", value: typedVehicle.model },
    {
      label: "Baujahr",
      value: `${typedVehicle.year}${typedVehicle.year_estimated ? " (geschätzt)" : ""}`,
    },
    { label: "FIN", value: typedVehicle.vin },
    { label: "Kennzeichen", value: typedVehicle.license_plate },
    { label: "Farbe", value: typedVehicle.color },
    { label: "Motortyp", value: typedVehicle.engine_type },
    {
      label: "Hubraum",
      value: typedVehicle.displacement_ccm
        ? `${typedVehicle.displacement_ccm.toLocaleString("de-DE")} ccm`
        : null,
    },
    {
      label: "Leistung",
      value: typedVehicle.horsepower ? `${typedVehicle.horsepower} PS` : null,
    },
    {
      label: "Laufleistung",
      value: typedVehicle.mileage_km
        ? `${typedVehicle.mileage_km.toLocaleString("de-DE")} km`
        : null,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Zurück
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/vehicles/${id}/edit`}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Bearbeiten
              </Link>
            </Button>
            <DeleteVehicleButton vehicleId={id} vehicleName={`${typedVehicle.make} ${typedVehicle.model}`} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Bildergalerie */}
        <div className="mb-8">
          {primaryImage ? (
            <div className="rounded-lg overflow-hidden bg-muted aspect-[16/9] max-h-[400px]">
              <img
                src={getImageUrl(primaryImage.storage_path, supabaseUrl)}
                alt={`${typedVehicle.make} ${typedVehicle.model}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="rounded-lg bg-muted aspect-[16/9] max-h-[400px] flex items-center justify-center">
              <Car className="h-20 w-20 text-muted-foreground/30" />
            </div>
          )}
          {sortedImages.length > 1 && (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 mt-2">
              {sortedImages.map((img) => (
                <div
                  key={img.id}
                  className="aspect-square rounded-md overflow-hidden bg-muted"
                >
                  <img
                    src={getImageUrl(img.storage_path, supabaseUrl)}
                    alt="Fahrzeugbild"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stammdaten */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">
              {typedVehicle.make} {typedVehicle.model}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground">Baujahr {typedVehicle.year}</span>
              {typedVehicle.year_estimated && (
                <Badge variant="secondary" className="text-xs">geschätzt</Badge>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {details
              .filter((d) => d.value)
              .map((detail) => (
                <div key={detail.label}>
                  <p className="text-sm text-muted-foreground">{detail.label}</p>
                  <p className="font-medium">{detail.value}</p>
                </div>
              ))}
          </div>

          <Separator />

          {/* Platzhalter für zukünftige Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              <p className="text-sm">Scheckheft</p>
              <p className="text-xs mt-1">Kommt bald</p>
            </div>
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              <p className="text-sm">Timeline</p>
              <p className="text-xs mt-1">Kommt bald</p>
            </div>
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              <p className="text-sm">Dokumente</p>
              <p className="text-xs mt-1">Kommt bald</p>
            </div>
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
