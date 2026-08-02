import { redirect } from "next/navigation";
import { VERKAUFSASSISTENT_AKTIV } from "@/lib/feature-flags";

interface KurzprofilPageProps {
  params: Promise<{ id: string }>;
}

export default async function KurzprofilPage({ params }: KurzprofilPageProps) {
  const { id } = await params;

  // Kurzverweis auf Schritt 2 des Verkaufsassistenten. Ist dieser ausgesetzt,
  // führt der Weg zurück aufs Fahrzeugprofil (siehe lib/feature-flags.ts).
  // Bereits veröffentlichte Kurzprofile unter /profil/<token> bleiben davon
  // unberührt und weiter erreichbar.
  if (!VERKAUFSASSISTENT_AKTIV) {
    redirect(`/vehicles/${id}`);
  }

  redirect(`/vehicles/${id}/verkaufsassistent?schritt=2`);
}
