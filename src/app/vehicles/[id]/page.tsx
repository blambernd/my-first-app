import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Car } from "lucide-react";
import type { VehicleWithImages } from "@/lib/validations/vehicle";

interface VehicleDetailPageProps {
  params: Promise<{ id: string }>;
}

function getImageUrl(storagePath: string, supabaseUrl: string): string {
  return `${supabaseUrl}/storage/v1/object/public/vehicle-images/${storagePath}`;
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
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

  const sortedImages = [...(typedVehicle.vehicle_images ?? [])].sort(
    (a, b) => a.position - b.position
  );
  const primaryImage =
    sortedImages.find((img) => img.is_primary) ?? sortedImages[0];

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
    <>
      {/* Image gallery */}
      {primaryImage ? (
        <div className="mb-8">
          <div className="rounded-lg overflow-hidden bg-muted/30 aspect-[21/9] max-h-[280px]">
            <img
              src={getImageUrl(primaryImage.storage_path, supabaseUrl)}
              alt={`${typedVehicle.make} ${typedVehicle.model}`}
              className="w-full h-full object-cover"
            />
          </div>
          {sortedImages.length > 1 && (
            <div className="grid grid-cols-6 gap-1.5 mt-1.5">
              {sortedImages.slice(0, 6).map((img) => (
                <div
                  key={img.id}
                  className="aspect-[4/3] rounded overflow-hidden bg-muted/30"
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
      ) : (
        <div className="rounded-lg bg-muted/10 aspect-[21/9] max-h-[200px] flex items-center justify-center mb-8">
          <Car className="h-12 w-12 text-muted-foreground/15" />
        </div>
      )}

      {/* Technical details */}
      <h2 className="text-xs font-medium tracking-widest uppercase text-muted-foreground/60 mb-6">
        Fahrzeugdaten
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-5">
        {details
          .filter((d) => d.value)
          .map((detail) => (
            <div key={detail.label}>
              <p className="text-xs text-muted-foreground/50 tracking-wide uppercase mb-1">
                {detail.label}
              </p>
              <p className="text-sm font-medium">{detail.value}</p>
            </div>
          ))}
      </div>
    </>
  );
}
