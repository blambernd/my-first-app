import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogoWithText } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <BrandLogoWithText />
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Anmelden</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Registrieren</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center space-y-6">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Die digitale Akte für deinen Oldtimer
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Dokumentiere die komplette Historie deiner Fahrzeuge — Wartungen,
            Restaurierungen, Dokumente. Alles an einem Ort, jederzeit abrufbar.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Kostenlos starten</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Anmelden</Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
