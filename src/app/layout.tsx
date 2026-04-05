import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oldtimer Garage — Digitale Fahrzeugakte",
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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
