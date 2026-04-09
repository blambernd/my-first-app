import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { VehicleForm, type ExistingDatekarte } from "@/components/vehicle-form";
import { ChevronLeft } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import type { VehicleWithImages } from "@/lib/validations/vehicle";

interface EditVehiclePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditVehiclePage({ params }: EditVehiclePageProps) {
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
  const sortedImages = [...(typedVehicle.vehicle_images ?? [])].sort(
    (a, b) => a.position - b.position
  );

  // Fetch existing Datenkarte
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const { data: datenkarteDoc } = await supabase
    .from("vehicle_documents")
    .select("id, storage_path, file_name, file_size, mime_type")
    .eq("vehicle_id", id)
    .eq("category", "datenkarte")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingDatekarte: ExistingDatekarte | null = datenkarteDoc
    ? {
        ...datenkarteDoc,
        url: `${supabaseUrl}/storage/v1/object/public/vehicle-documents/${datenkarteDoc.storage_path}`,
      }
    : null;

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link
            href={`/vehicles/${id}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Zurück
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">
          {typedVehicle.make} {typedVehicle.model} bearbeiten
        </h2>
        <VehicleForm
          mode="edit"
          vehicle={typedVehicle}
          vehicleImages={sortedImages}
          existingDatekarte={existingDatekarte}
        />
      </main>
      <Toaster />
    </div>
  );
}
