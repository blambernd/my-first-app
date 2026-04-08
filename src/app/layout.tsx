import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oldtimer Docs — Digitale Fahrzeugakte",
  description:
    "Dokumentiere die komplette Historie deiner Oldtimer. Wartungen, Restaurierungen, Dokumente — alles an einem Ort.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
