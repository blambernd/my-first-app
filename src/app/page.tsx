import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = {
  title: "Oldtimer Docs — Digitale Fahrzeugakte für Klassiker",
  // Was hier steht, zeigen Suchmaschinen an — der Text erreicht Menschen,
  // bevor die Seite es tut. Er nannte bis zum 2026-08-05 „Verkaufsinserate",
  // obwohl die Funktion abgeschaltet ist (siehe feature-flags.ts).
  description:
    "Die digitale Plattform für Oldtimer-Besitzer. Dokumentiere Wartungen, Restaurierungen und Kosten — vom Tankbuch bis zur Wertentwicklung. 14 Tage kostenlos testen.",
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <Suspense>
      <LandingPage />
    </Suspense>
  );
}
