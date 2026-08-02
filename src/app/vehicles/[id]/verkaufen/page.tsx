import { redirect } from "next/navigation";
import { VERKAUFSASSISTENT_AKTIV } from "@/lib/feature-flags";

interface VerkaufenPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerkaufenPage({ params }: VerkaufenPageProps) {
  const { id } = await params;

  // Kurzverweis auf Schritt 3 (Inserat) des Verkaufsassistenten.
  if (!VERKAUFSASSISTENT_AKTIV) {
    redirect(`/vehicles/${id}`);
  }

  redirect(`/vehicles/${id}/verkaufsassistent?schritt=3`);
}
