import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { LandingPage } from "@/components/landing-page";

export const metadata: Metadata = {
  title: "Oldtimer Docs — Digitale Fahrzeugakte für Klassiker",
  description:
    "Die digitale Plattform für Oldtimer-Besitzer. Dokumentiere Wartungen, Restaurierungen und Besitzerwechsel. Erstelle Verkaufsinserate und teile die Fahrzeughistorie.",
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
