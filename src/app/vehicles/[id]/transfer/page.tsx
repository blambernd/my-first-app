import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { TransferPageClient } from "./client";
import { ChevronLeft } from "lucide-react";
import type { VehicleTransfer } from "@/lib/validations/transfer";

interface TransferPageProps {
  params: Promise<{ id: string }>;
}

export default async function TransferPage({ params }: TransferPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Only the owner can access this page
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, make, model, year")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!vehicle) {
    notFound();
  }

  // Check for existing active transfer
  const { data: activeTransfer } = await supabase
    .from("vehicle_transfers")
    .select("*")
    .eq("vehicle_id", id)
    .eq("status", "offen")
    .single();

  const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.year})`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/vehicles/${id}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Zurück zum Fahrzeug
        </Link>
        <h2 className="text-xl font-semibold">Fahrzeug übertragen</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Übertrage <strong>{vehicleName}</strong> an einen neuen Besitzer.
          Der Transfer muss vom Empfänger bestätigt werden.
        </p>
      </div>

      <TransferPageClient
        vehicleId={id}
        vehicleName={vehicleName}
        activeTransfer={(activeTransfer as VehicleTransfer) ?? null}
      />
    </div>
  );
}
