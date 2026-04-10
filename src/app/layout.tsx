import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site-footer";
import { OfflineBanner } from "@/components/offline-banner";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { ConditionalAnalytics } from "@/components/conditional-analytics";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oldtimer Docs — Digitale Fahrzeugakte",
  description:
    "Dokumentiere die komplette Historie deiner Oldtimer. Wartungen, Restaurierungen, Dokumente — alles an einem Ort.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Oldtimer Docs",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "hsl(220, 60%, 22%)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <OfflineBanner />
        <CookieConsentBanner />
        <ServiceWorkerRegister />
        <ConditionalAnalytics />
      </body>
    </html>
  );
}
