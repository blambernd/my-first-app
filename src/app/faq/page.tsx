import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogoWithText } from "@/components/brand-logo";
import { faqs } from "@/lib/faq-data";
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
          {"H\u00e4ufig gestellte Fragen"}
        </h1>
        <p className="text-muted-foreground mb-8">
          {"Hier finden Sie Antworten auf die h\u00e4ufigsten Fragen rund um Oldtimer Docs. Falls Ihre Frage nicht dabei ist, k\u00f6nnen Sie uns gerne \u00fcber die "}
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
    </div>
  );
}
