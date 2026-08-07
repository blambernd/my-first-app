"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  FileText,
  Clock,
  Newspaper,
  Wallet,
  TrendingUp,
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
    icon: Wallet,
    title: "Kosten im Blick",
    description:
      "Tankbuch, Versicherung, Steuer, Ersatzteile \u2014 alles an einer Stelle. Der \u00dcberblick zeigt, was Ihr Fahrzeug im Jahr kostet.",
  },
  {
    icon: TrendingUp,
    title: "Wertentwicklung",
    description:
      "Kaufpreis, Investitionen und laufende Kosten getrennt betrachtet \u2014 damit Sie sehen, was in das Fahrzeug geflossen ist.",
  },
  {
    icon: ArrowRightLeft,
    title: "Fahrzeug-Transfer",
    description:
      "Fahrzeug samt Historie digital an den neuen Besitzer \u00fcbergeben. Ihre Kostendaten bleiben dabei bei Ihnen.",
  },
];

/**
 * \u26a0\ufe0f PLATZHALTER \u2014 vor dem Einschalten durch echte Zahlen ersetzen.
 *
 * Dieser Block erscheint nur, wenn `NEXT_PUBLIC_MVP_MODE` **nicht** \u201etrue" ist;
 * in der Produktion steht es auf true, die Zahlen sind also derzeit nicht
 * \u00f6ffentlich. Das ist auch gut so: Die vorherigen Werte (\u201e500+ Fahrzeuge",
 * \u201e10.000+ Eintr\u00e4ge", \u201e98 % zufriedene Nutzer") waren erfunden \u2014 tats\u00e4chlich
 * waren es am 2026-08-05 **6 Fahrzeuge, 5 Scheckheft-Eintr\u00e4ge, 7 Nutzer**.
 *
 * Sie sind bewusst durch offensichtliche Platzhalter ersetzt: Wer das Flag
 * umlegt, soll eine Baustelle sehen und keine plausibel klingende Unwahrheit.
 */
const stats = [
  { value: "\u2014", label: "Fahrzeuge dokumentiert (Zahl eintragen)" },
  { value: "\u2014", label: "Scheckheft-Eintr\u00e4ge (Zahl eintragen)" },
  { value: "\u2014", label: "aktive Nutzer (Zahl eintragen)" },
];

/**
 * ⚠️ PLATZHALTER — diese Stimmen sind nicht von echten Nutzern.
 *
 * Sie erscheinen nur bei abgeschaltetem `NEXT_PUBLIC_MVP_MODE` und sind
 * derzeit nicht öffentlich. Vor dem Einschalten durch echte, freigegebene
 * Zitate ersetzen oder den Abschnitt streichen — erfundene Kundenstimmen als
 * echte auszugeben ist etwas anderes als eine unfertige Zahl.
 *
 * Die dritte Stimme lobte das Verkaufsinserat; die Funktion ist abgeschaltet
 * (siehe `feature-flags.ts`) und die Stimme deshalb entfernt.
 */
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
];

/**
 * Die Tarifleisten spiegeln die tatsächlichen Grenzen aus `PLANS` und die
 * Prüfungen in den Seiten wider — nicht die Wunschliste.
 *
 * **Was hier NICHT steht:** Verkaufsassistent, Marktüberblick und Kurzprofil.
 * Alle drei sind derzeit abgeschaltet (`src/lib/feature-flags.ts`). Etwas zu
 * bewerben, das ein neu registrierter Nutzer nicht vorfindet, wäre ein
 * Versprechen, das die Anwendung nicht hält.
 *
 * Der entscheidende Unterschied ist die **Fahrzeuganzahl**: 1 gegen
 * unbegrenzt. Er steht deshalb an erster Stelle.
 */
const freePlanFeatures = [
  { text: "1 Fahrzeug", included: true },
  { text: "100 MB Speicher", included: true },
  { text: "Digitales Scheckheft", included: true },
  { text: "Dokumenten-Archiv", included: true },
  { text: "Fahrzeug-Timeline", included: true },
  { text: "Kostenerfassung und Überblick", included: true },
  { text: "Kostenauswertung", included: false },
  { text: "Wertentwicklung", included: false },
];

const premiumPlanFeatures = [
  { text: "Unbegrenzt Fahrzeuge", included: true },
  { text: "5 GB Speicher", included: true },
  { text: "Digitales Scheckheft", included: true },
  { text: "Dokumenten-Archiv", included: true },
  { text: "Fahrzeug-Timeline", included: true },
  { text: "Kostenerfassung und Überblick", included: true },
  { text: "Kostenauswertung", included: true },
  { text: "Wertentwicklung", included: true },
];

/**
 * Merker "in dieser Sitzung registriert" als externer Speicher.
 *
 * sessionStorage gibt es auf dem Server nicht. useSyncExternalStore trennt
 * Server-Schnappschuss (immer false) und Client-Wert, sodass Server-HTML und
 * erstes Client-Rendering übereinstimmen.
 */
function subscribeRegistered(onChange: () => void): () => void {
  window.addEventListener("registered-change", onChange);
  return () => window.removeEventListener("registered-change", onChange);
}

function getRegisteredSnapshot(): boolean {
  try {
    return sessionStorage.getItem("registered") === "true";
  } catch {
    return false;
  }
}

function getRegisteredServerSnapshot(): boolean {
  return false;
}

export function LandingPage() {
  const searchParams = useSearchParams();
  const registeredParam = searchParams.get("registered") === "true";
  // Bewusst NICHT im useState-Initialisierer aus sessionStorage gelesen:
  // Der Initialisierer läuft beim Rendern, und den gibt es auf dem Server
  // auch. Dort schlägt der Zugriff fehl (→ false), im Browser kann er true
  // ergeben — das Markup wiche voneinander ab und React bräche die Hydration
  // ab. Der Wert kommt deshalb über useSyncExternalStore.
  const gespeichertRegistriert = useSyncExternalStore(
    subscribeRegistered,
    getRegisteredSnapshot,
    getRegisteredServerSnapshot
  );
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    // Merkt die Registrierung für die Dauer der Sitzung, damit ein Neuladen
    // ohne Parameter den Hinweis nicht verliert.
    if (registeredParam && !gespeichertRegistriert) {
      try {
        sessionStorage.setItem("registered", "true");
        window.dispatchEvent(new Event("registered-change"));
      } catch {
        // Ohne sessionStorage bleibt es beim Parameter — kein Grund zu scheitern
      }
    }
  }, [registeredParam, gespeichertRegistriert]);

  // Allein aus dem Store — nicht zusätzlich aus dem URL-Parameter. Der stammt
  // aus useSearchParams und steht beim Server-Rendering nicht verlässlich zur
  // Verfügung; er würde den Unterschied nur verlagern. Der Effekt oben schreibt
  // ihn in den Store, das Ereignis löst ein erneutes Lesen aus.
  const isRegistered = gespeichertRegistriert;

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
      <section className="px-4 py-12 sm:py-20 md:py-28">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <Badge variant="secondary" className="text-sm px-4 py-1">
            {"Die digitale Fahrzeugakte f\u00fcr Oldtimer"}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
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

        {/* Hero visual */}
        <div className="container mx-auto max-w-4xl mt-10 sm:mt-16 px-4">
          <div className="rounded-xl border shadow-2xl overflow-hidden">
            <Image
              src="/images/dashboard-preview.png"
              alt="Oldtimer Docs Dashboard — Fahrzeugübersicht mit Timeline und Scheckheft"
              width={1200}
              height={675}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 bg-muted/30" id="features">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              {"Alles, was Ihr Oldtimer braucht"}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
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
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              {"Einfache, transparente Preise"}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-4">
              {"Starten Sie kostenlos und upgraden Sie, wenn Sie mehr brauchen."}
            </p>
            {/* Hier stand bis zum 2026-08-07 „14 Tage kostenlos testen".
                Der Testzeitraum ist entfallen (Entscheidung des Nutzers), und
                ein Versprechen, das die Anwendung nicht hält, darf nicht auf
                der Startseite stehen. Der kostenlose Tarif bleibt der
                Einstieg — er ist dauerhaft und braucht keine Zahlungsdaten. */}
            <p className="text-base font-medium mb-8">
              {/* Bewusst konkret statt „voller Funktionsumfang": Auswertung und
                  Wertentwicklung sind im kostenlosen Tarif gerade nicht
                  enthalten. Eine unscharfe Formulierung wäre dieselbe Art
                  Überversprechen, wegen der die Seite überarbeitet wurde. */}
              <span className="text-primary">{"Dauerhaft kostenlos starten"}</span>
              {" — ein Fahrzeug, Scheckheft, Dokumente und Kostenerfassung. Keine Zahlungsdaten nötig."}
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
            <Card className="relative border-amber-300 shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="px-4 py-1 bg-amber-500 hover:bg-amber-500">
                  {process.env.NEXT_PUBLIC_MVP_MODE === "true" ? "Coming Soon" : "Beliebt"}
                </Badge>
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
                  {isRegistered ? "Registriert ✓" : <Link href="/register">Kostenlos starten</Link>}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Social Proof (hidden in MVP) */}
      {process.env.NEXT_PUBLIC_MVP_MODE !== "true" && (
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
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
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
      )}

      {/* Blog Teaser */}
      <section className="px-4 py-20 bg-muted/30" id="blog">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Aus unserem Blog
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Tipps und Ratgeber rund um Oldtimer, Dokumentation und Werterhaltung.
            </p>
          </div>
          <Card className="hover:bg-muted/50 transition-colors">
            <Link href="/blog/oldtimer-richtig-dokumentieren">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="hidden sm:flex h-12 w-12 rounded-lg bg-primary/10 items-center justify-center flex-shrink-0 mt-1">
                    <Newspaper className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      Oldtimer richtig dokumentieren — warum sich eine lückenlose Fahrzeughistorie lohnt
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      Eine vollständige Dokumentation steigert den Wert Ihres Oldtimers, vereinfacht den Verkauf und schützt vor bösen Überraschungen. Erfahren Sie, was in eine gute Fahrzeugakte gehört.
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        8 Min. Lesezeit
                      </span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Dokumentation</Badge>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Ratgeber</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/blog">Alle Beiträge ansehen</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="px-4 py-20" id="faq">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
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
          <h2 className="text-2xl sm:text-3xl font-bold">
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
