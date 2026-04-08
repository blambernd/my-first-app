import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogoWithText } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "FAQ - Oldtimer Docs",
  description:
    "Antworten auf die wichtigsten Fragen zu Oldtimer Docs: Fahrzeughistorie dokumentieren, Scheckheft, Dokumente, Verkaufsinserate und mehr.",
};

const faqs = [
  {
    question: "Was ist Oldtimer Docs?",
    answer:
      "Oldtimer Docs ist eine digitale Plattform, auf der Oldtimer-Besitzer die komplette Historie ihrer Fahrzeuge dokumentieren. Von Wartungen und Restaurierungen bis hin zu Besitzerwechseln \u2014 alle Informationen an einem Ort, jederzeit abrufbar und teilbar.",
  },
  {
    question: "Wie erstelle ich ein Fahrzeugprofil?",
    answer:
      "Nach der Registrierung legen Sie im Dashboard \u00fcber den Button \u201eFahrzeug hinzuf\u00fcgen\u201c ein neues Profil an. Tragen Sie die Basisdaten wie Marke, Modell, Baujahr und optional die Fahrgestellnummer ein. Danach k\u00f6nnen Sie Fotos hochladen und weitere Details erg\u00e4nzen.",
  },
  {
    question: "Welche Dokumente kann ich hochladen?",
    answer:
      "Alle fahrzeugbezogenen Dokumente: Rechnungen, Gutachten, T\u00dcV-Berichte, Versicherungsunterlagen, Kaufvertr\u00e4ge oder Restaurierungsdokumentationen. Unterst\u00fctzt werden PDF, JPG, PNG und weitere g\u00e4ngige Dateitypen.",
  },
  {
    question: "Ist meine Fahrzeughistorie \u00f6ffentlich sichtbar?",
    answer:
      "Nein, Ihre Fahrzeugdaten sind standardm\u00e4\u00dfig privat. Sie k\u00f6nnen jedoch ein \u00f6ffentliches Kurzprofil erstellen und per Link mit Interessenten teilen \u2014 zum Beispiel beim Verkauf.",
  },
  {
    question: "Wie funktioniert das digitale Scheckheft?",
    answer:
      "Im digitalen Scheckheft erfassen Sie Wartungen, Reparaturen und Inspektionen chronologisch. Jeder Eintrag enth\u00e4lt Datum, Kilometerstand, eine Beschreibung der Arbeiten und optional Belege als Anhang. So entsteht eine l\u00fcckenlose Wartungshistorie.",
  },
  {
    question: "Kann ich mein Fahrzeug an einen neuen Besitzer \u00fcbertragen?",
    answer:
      "Ja! \u00dcber den digitalen Fahrzeug-Transfer generieren Sie einen \u00dcbertragungslink und senden ihn an den neuen Besitzer. Nach Best\u00e4tigung wird das Fahrzeug inklusive gesamter Historie an dessen Konto \u00fcbertragen.",
  },
  {
    question: "Wie erstelle ich ein Verkaufsinserat?",
    answer:
      "Im Men\u00fcpunkt \u201eInserat\u201c Ihres Fahrzeugprofils erstellen Sie ein Verkaufsinserat. Fahrzeugdaten werden automatisch \u00fcbernommen. Erg\u00e4nzen Sie Beschreibung, Preis und Fotos und pr\u00fcfen Sie die Vorschau, bevor Sie ver\u00f6ffentlichen.",
  },
  {
    question: "Ist die Nutzung kostenlos?",
    answer:
      "Oldtimer Docs bietet eine kostenlose Basisversion zum Anlegen und Dokumentieren von Fahrzeugen. F\u00fcr erweiterte Funktionen und zus\u00e4tzliche Fahrzeuge ist ein Premium-Upgrade verf\u00fcgbar.",
  },
  {
    question: "Wie kann ich mein Konto l\u00f6schen?",
    answer:
      "In den Kontoeinstellungen finden Sie die Option \u201eKonto l\u00f6schen\u201c. Bitte beachten Sie, dass dabei alle Fahrzeugdaten, Dokumente und Bilder unwiderruflich gel\u00f6scht werden.",
  },
  {
    question: "Wie kann ich Feedback geben oder einen Bug melden?",
    answer:
      "\u00dcber unsere Kontaktseite senden Sie uns jederzeit Verbesserungsvorschl\u00e4ge oder melden Fehler. W\u00e4hlen Sie die passende Kategorie und beschreiben Sie Ihr Anliegen \u2014 wir freuen uns \u00fcber jedes Feedback!",
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <BrandLogoWithText />
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-4">
          H{"\u00e4"}ufig gestellte Fragen
        </h1>
        <p className="text-muted-foreground mb-8">
          Hier finden Sie Antworten auf die h{"\u00e4"}ufigsten Fragen rund um
          Oldtimer Docs. Falls Ihre Frage nicht dabei ist, k{"\u00f6"}nnen Sie
          uns gerne {"\u00fc"}ber die{" "}
          <Link href="/kontakt" className="text-primary underline">
            Kontaktseite
          </Link>{" "}
          erreichen.
        </p>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>

      <SiteFooter />
    </div>
  );
}
