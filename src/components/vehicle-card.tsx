"use client";

import Link from "next/link";
import { Car, Calendar, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VehicleWithImages } from "@/lib/validations/vehicle";
import { createClient } from "@/lib/supabase";

interface VehicleCardProps {
  vehicle: VehicleWithImages;
}

function getImageUrl(storagePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage
    .from("vehicle-images")
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const primaryImage = vehicle.vehicle_images?.find((img) => img.is_primary);
  const firstImage = primaryImage ?? vehicle.vehicle_images?.[0];
  const imageUrl = firstImage ? getImageUrl(firstImage.storage_path) : null;

  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
        <div className="aspect-[4/3] relative bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          {vehicle.year_estimated && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 text-xs"
            >
              Baujahr geschätzt
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg truncate">
            {vehicle.make} {vehicle.model}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Baujahr {vehicle.year}</span>
          </div>
          {vehicle.license_plate && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {vehicle.license_plate}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function AddVehicleCard() {
  return (
    <Link href="/vehicles/new">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full border-dashed">
        <div className="aspect-[4/3] flex items-center justify-center bg-muted/30">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Plus className="h-10 w-10" />
            <span className="text-sm font-medium">Fahrzeug hinzufügen</span>
          </div>
        </div>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Lege deinen nächsten Oldtimer an
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
