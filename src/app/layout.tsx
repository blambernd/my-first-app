import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { OfflineBanner } from "@/components/offline-banner";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { ConditionalAnalytics } from "@/components/conditional-analytics";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://oldtimer-docs.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Oldtimer Docs — Digitale Fahrzeugakte für Klassiker",
    template: "%s | Oldtimer Docs",
  },
  description:
    "Dokumentiere die komplette Historie deiner Oldtimer digital. Scheckheft, Wartungen, Restaurierungen, Dokumente und Fahrzeug-Transfer — alles an einem Ort.",
  keywords: [
    "Oldtimer",
    "Fahrzeughistorie",
    "digitales Scheckheft",
    "Klassiker",
    "Fahrzeugdokumentation",
    "Oldtimer Dokumentation",
    "Wartungshistorie",
    "Restaurierung",
    "Fahrzeugakte",
  ],
  authors: [{ name: "Oldtimer Docs" }],
  creator: "Oldtimer Docs",
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: BASE_URL,
    siteName: "Oldtimer Docs",
    title: "Oldtimer Docs — Digitale Fahrzeugakte für Klassiker",
    description:
      "Dokumentiere die komplette Historie deiner Oldtimer digital. Scheckheft, Wartungen, Restaurierungen, Dokumente — alles an einem Ort.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Oldtimer Docs — Digitale Fahrzeugakte",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Oldtimer Docs — Digitale Fahrzeugakte für Klassiker",
    description:
      "Dokumentiere die komplette Historie deiner Oldtimer digital. Scheckheft, Wartungen, Restaurierungen, Dokumente — alles an einem Ort.",
    images: ["/images/og-image.png"],
  },
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
  alternates: {
    canonical: BASE_URL,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  name: "Oldtimer Docs",
                  url: BASE_URL,
                  logo: `${BASE_URL}/icon-512.png`,
                  description:
                    "Digitale Fahrzeugakte für Oldtimer und Klassiker. Scheckheft, Dokumente und Fahrzeughistorie an einem Ort.",
                },
                {
                  "@type": "WebSite",
                  name: "Oldtimer Docs",
                  url: BASE_URL,
                  potentialAction: {
                    "@type": "SearchAction",
                    target: `${BASE_URL}/dashboard`,
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <Toaster />
        <OfflineBanner />
        <CookieConsentBanner />
        <ServiceWorkerRegister />
        <ConditionalAnalytics />
      </body>
    </html>
  );
}
