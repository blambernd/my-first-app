"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  FileText,
  Clock,
  Share2,
  ShoppingBag,
  ArrowRightLeft,
  Check,
  X,
  Star,
  Car,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BrandLogoWithText } from "@/components/brand-logo";
import { faqs } from "@/lib/faq-data";

const features = [
  {
    icon: BookOpen,
    title: "Digitales Scheckheft",
    description:
      "Wartungen, Reparaturen und Inspektionen chronologisch erfassen \u2014 mit Belegen und Kilometerstand.",
  },
  {
    icon: FileText,
    title: "Dokumenten-Archiv",
    description:
      "Rechnungen, Gutachten, T\u00dcV-Berichte und Kaufvertr\u00e4ge sicher digital archivieren.",
  },
  {
    icon: Clock,
    title: "Fahrzeug-Timeline",
    description:
      "Die komplette Geschichte Ihres Fahrzeugs auf einen Blick \u2014 von der Erstzulassung bis heute.",
  },
  {
    icon: Share2,
    title: "Kurzprofil teilen",
    description:
      "Erstellen Sie ein \u00f6ffentliches Fahrzeugprofil und teilen Sie es per Link mit Interessenten.",
  },
  {
    icon: ShoppingBag,
    title: "Verkaufsinserat",
    description:
      "Professionelle Verkaufsinserate erstellen \u2014 Fahrzeugdaten werden automatisch \u00fcbernommen.",
  },
  {
    icon: ArrowRightLeft,
    title: "Fahrzeug-Transfer",
    description:
      "Fahrzeug inklusive kompletter Historie digital an den neuen Besitzer \u00fcbertragen.",
  },
];

const stats = [
  { value: "500+", label: "Fahrzeuge dokumentiert" },
  { value: "10.000+", label: "Scheckheft-Eintr\u00e4ge" },
  { value: "98%", label: "zufriedene Nutzer" },
];

const testimonials = [
  {
    name: "Thomas M.",
    role: "Mercedes 280 SL, Bj. 1971",
    quote:
      "Endlich habe ich alle Unterlagen meines Pagode an einem Ort. Beim letzten T\u00dcV konnte ich die komplette Historie digital vorzeigen.",
  },
  {
    name: "Sabine K.",
    role: "VW K\u00e4fer 1303, Bj. 1973",
    quote:
      "Den Fahrzeug-Transfer beim Kauf meines K\u00e4fers fand ich genial. Die gesamte Dokumentation des Vorbesitzers war sofort in meinem Konto.",
  },
  {
    name: "Markus R.",
    role: "Porsche 911, Bj. 1989",
    quote:
      "Das Verkaufsinserat hat mir viel Arbeit erspart. Alle Daten wurden automatisch \u00fcbernommen und der K\u00e4ufer war von der l\u00fcckenlosen Historie beeindruckt.",
  },
];

const freePlanFeatures = [
  { text: "1 Fahrzeug", included: true },
  { text: "100 MB Speicher", included: true },
  { text: "Digitales Scheckheft", included: true },
  { text: "Dokumenten-Archiv", included: true },
  { text: "Fahrzeug-Timeline", included: true },
  { text: "Kurzprofil teilen", included: true },
  { text: "Verkaufsassistent", included: false },
  { text: "Marktpreis-Analyse", included: false },
];

const premiumPlanFeatures = [
  { text: "Unbegrenzt Fahrzeuge", included: true },
  { text: "5 GB Speicher", included: true },
  { text: "Digitales Scheckheft", included: true },
  { text: "Dokumenten-Archiv", included: true },
  { text: "Fahrzeug-Timeline", included: true },
  { text: "Kurzprofil teilen", included: true },
  { text: "Verkaufsassistent", included: true },
  { text: "Marktpreis-Analyse", included: true },
];

export function LandingPage() {
  const searchParams = useSearchParams();
  const registeredParam = searchParams.get("registered") === "true";
  const [isRegistered, setIsRegistered] = useState(() => {
    try { return localStorage.getItem("registered") === "true"; } catch { return false; }
  });
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    if (registeredParam && !isRegistered) {
      localStorage.setItem("registered", "true");
      setIsRegistered(true);
    }
  }, [registeredParam, isRegistered]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <BrandLogoWithText />
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Anmelden</Link>
            </Button>
            <Button asChild={!isRegistered} disabled={isRegistered}>
              {isRegistered ? "Registriert ✓" : <Link href="/register">Registrieren</Link>}
            </Button>
          </div>
        </div>
      </header>

      {/* Registration success banner */}
      {isRegistered && (
        <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 px-4 py-3 text-center text-sm text-green-700 dark:text-green-400">
          Registrierung erfolgreich! Bitte überprüfe dein E-Mail-Postfach und bestätige deine E-Mail-Adresse.
        </div>
      )}

      {/* Hero */}
      <section className="px-4 py-20 sm:py-28">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <Badge variant="secondary" className="text-sm px-4 py-1">
            {"Die digitale Fahrzeugakte f\u00fcr Oldtimer"}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {"Jede Wartung. Jedes Dokument."}
            <br />
            <span className="text-primary">{"Jedes Detail."}</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            {"Dokumentieren Sie die komplette Historie Ihrer Oldtimer digital. Wartungen, Restaurierungen, Dokumente \u2014 alles an einem Ort, jederzeit abrufbar und teilbar."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" asChild={!isRegistered} disabled={isRegistered} className="text-base px-8">
              {isRegistered ? "Registriert ✓" : <Link href="/register">Kostenlos starten</Link>}
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link href="/login">Anmelden</Link>
            </Button>
          </div>
        </div>

        {/* Hero visual placeholder */}
        <div className="container mx-auto max-w-4xl mt-16 px-4">
          <div className="rounded-xl border bg-gradient-to-br from-muted/50 to-muted p-8 sm:p-12 text-center">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Car className="h-12 w-12" />
              <div className="text-left">
                <p className="font-semibold text-foreground text-lg">App-Vorschau</p>
                <p className="text-sm">Dashboard mit Fahrzeug-Timeline und Scheckheft</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 bg-muted/30" id="features">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {"Alles, was Ihr Oldtimer braucht"}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {"Von der ersten Wartung bis zum Verkauf \u2014 Oldtimer Docs begleitet Sie und Ihr Fahrzeug."}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-20" id="preise">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {"Einfache, transparente Preise"}
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              {"Starten Sie kostenlos und upgraden Sie, wenn Sie mehr brauchen."}
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 rounded-full border p-1 bg-muted/50">
              <button
                onClick={() => setIsYearly(false)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  !isYearly
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Monatlich
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isYearly
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {"J\u00e4hrlich"}
                <Badge variant="secondary" className="ml-2 text-xs">
                  2 Monate gratis
                </Badge>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Free</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">0 &euro;</span>
                  <span className="text-muted-foreground ml-1">/Monat</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {"F\u00fcr den Einstieg"}
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 mb-8">
                  {freePlanFeatures.map((f) => (
                    <li key={f.text} className="flex items-center gap-3 text-sm">
                      {f.included ? (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                      )}
                      <span className={f.included ? "" : "text-muted-foreground/60"}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full" asChild={!isRegistered} disabled={isRegistered}>
                  {isRegistered ? "Registriert ✓" : <Link href="/register">Kostenlos starten</Link>}
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-primary shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="px-4 py-1">Empfohlen</Badge>
              </div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">Premium</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {isYearly ? "4,17" : "4,99"} &euro;
                  </span>
                  <span className="text-muted-foreground ml-1">/Monat</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {isYearly
                    ? "49,99 \u20ac/Jahr (2 Monate gratis)"
                    : "oder 49,99 \u20ac/Jahr"}
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-3 mb-8">
                  {premiumPlanFeatures.map((f) => (
                    <li key={f.text} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" asChild={!isRegistered} disabled={isRegistered}>
                  {isRegistered ? "Registriert ✓" : <Link href="/register">14 Tage kostenlos testen</Link>}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-4 py-20 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {"Das sagen unsere Nutzer"}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="text-sm mb-4 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="px-4 py-20" id="faq">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {"H\u00e4ufig gestellte Fragen"}
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.slice(0, 4).map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/faq">Alle FAQs ansehen</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-3xl text-center space-y-6">
          <Shield className="h-12 w-12 mx-auto opacity-90" />
          <h2 className="text-3xl font-bold">
            {"Bereit, Ihren Oldtimer zu dokumentieren?"}
          </h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto">
            {"Starten Sie kostenlos und sichern Sie die Historie Ihres Fahrzeugs f\u00fcr die Zukunft."}
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild={!isRegistered}
            disabled={isRegistered}
            className="text-base px-8"
          >
            {isRegistered ? "Registriert ✓" : <Link href="/register">Jetzt kostenlos starten</Link>}
          </Button>
        </div>
      </section>
    </div>
  );
}
