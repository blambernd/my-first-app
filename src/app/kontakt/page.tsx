import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogoWithText } from "@/components/brand-logo";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Kontakt & Feedback",
  description:
    "Kontaktieren Sie uns – allgemeine Anfragen, Verbesserungsvorschläge, Bugs melden oder Fragen zu Ihrem Account.",
  alternates: {
    canonical: "/kontakt",
  },
};

export default function KontaktPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <BrandLogoWithText />
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Kontakt</h1>
        <p className="text-muted-foreground mb-8">
          Haben Sie eine Frage, einen Verbesserungsvorschlag oder möchten Sie
          einen Fehler melden? Füllen Sie einfach das Formular aus und wir
          melden uns bei Ihnen.
        </p>

        <ContactForm />
      </main>

    </div>
  );
}
