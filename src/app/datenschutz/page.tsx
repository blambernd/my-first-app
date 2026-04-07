import Link from "next/link";
import { BrandLogoWithText } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

export default function DatenschutzPage() {
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
        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Datenschutz auf einen Blick</h2>
            <h3 className="text-lg font-medium mb-2">Allgemeine Hinweise</h3>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was
              mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website
              besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie
              persönlich identifiziert werden können. Ausführliche Informationen zum
              Thema Datenschutz entnehmen Sie unserer nachfolgenden
              Datenschutzerklärung.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Verantwortliche Stelle</h2>
            <p>
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser
              Website ist:
            </p>
            <p>
              Bernhard Lambernd<br />
              Hans-Mayer-Siedlung 58<br />
              21502 Geesthacht<br />
              E-Mail: b.lambernd@gmail.com
            </p>
            <p>
              Verantwortliche Stelle ist die natürliche oder juristische Person, die
              allein oder gemeinsam mit anderen über die Zwecke und Mittel der
              Verarbeitung von personenbezogenen Daten entscheidet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Datenerfassung auf dieser Website</h2>

            <h3 className="text-lg font-medium mb-2">Cookies</h3>
            <p>
              Unsere Website verwendet Cookies. Dabei handelt es sich um kleine
              Textdateien, die Ihr Webbrowser auf Ihrem Endgerät speichert. Cookies
              helfen uns dabei, unser Angebot nutzerfreundlicher und sicherer zu
              machen. Wir verwenden ausschließlich technisch notwendige Cookies für
              die Authentifizierung und Sitzungsverwaltung. Diese Cookies sind für
              den Betrieb der Website zwingend erforderlich.
            </p>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO
              (berechtigtes Interesse an der Bereitstellung einer funktionsfähigen
              Website).
            </p>

            <h3 className="text-lg font-medium mb-2 mt-4">Registrierung und Benutzerkonto</h3>
            <p>
              Sie können sich auf unserer Website registrieren, um zusätzliche
              Funktionen nutzen zu können. Wir verwenden dafür den Dienst Supabase
              Auth. Die bei der Registrierung eingegebenen Daten (E-Mail-Adresse,
              Passwort) werden ausschließlich zum Zweck der Bereitstellung des
              Benutzerkontos verarbeitet.
            </p>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO
              (Vertragserfüllung) und Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
            </p>

            <h3 className="text-lg font-medium mb-2 mt-4">Fahrzeugdaten</h3>
            <p>
              Wenn Sie Fahrzeuge in Ihrem Konto anlegen, werden die von Ihnen
              eingegebenen Fahrzeugdaten (Marke, Modell, Baujahr, FIN, Kennzeichen
              etc.) sowie hochgeladene Bilder und Dokumente gespeichert. Diese Daten
              werden ausschließlich zur Bereitstellung des Dienstes verarbeitet und
              nicht an Dritte weitergegeben.
            </p>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO
              (Vertragserfüllung).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Hosting</h2>
            <p>
              Diese Website wird bei Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA
              91789, USA) gehostet. Die Datenbank und Authentifizierung werden über
              Supabase Inc. bereitgestellt. Beim Besuch der Website werden
              automatisch Informationen in Server-Log-Dateien gespeichert, die Ihr
              Browser automatisch übermittelt (IP-Adresse, Browsertyp, Betriebssystem,
              Referrer-URL, Zeitpunkt des Zugriffs).
            </p>
            <p>
              <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO
              (berechtigtes Interesse an der technisch fehlerfreien Darstellung).
            </p>
            <p>
              Hinweis: Die Datenübermittlung in die USA erfolgt auf Grundlage des
              EU-U.S. Data Privacy Framework.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Ihre Rechte</h2>
            <p>Sie haben jederzeit das Recht:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <strong>Auskunft</strong> über Ihre gespeicherten Daten zu erhalten
                (Art. 15 DSGVO)
              </li>
              <li>
                <strong>Berichtigung</strong> unrichtiger Daten zu verlangen (Art. 16
                DSGVO)
              </li>
              <li>
                <strong>Löschung</strong> Ihrer Daten zu verlangen (Art. 17 DSGVO)
              </li>
              <li>
                <strong>Einschränkung</strong> der Verarbeitung zu verlangen (Art. 18
                DSGVO)
              </li>
              <li>
                <strong>Datenübertragbarkeit</strong> zu verlangen (Art. 20 DSGVO)
              </li>
              <li>
                <strong>Widerspruch</strong> gegen die Verarbeitung einzulegen (Art.
                21 DSGVO)
              </li>
            </ul>
            <p className="mt-3">
              Wenn Sie der Meinung sind, dass die Verarbeitung Ihrer Daten gegen das
              Datenschutzrecht verstößt, haben Sie das Recht, sich bei einer
              Aufsichtsbehörde zu beschweren (Art. 77 DSGVO).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Löschung von Daten</h2>
            <p>
              Ihre Daten werden gelöscht, sobald der Zweck der Speicherung entfällt.
              Bei Löschung Ihres Benutzerkontos werden alle zugehörigen Daten
              (Fahrzeuge, Dokumente, Bilder) unwiderruflich gelöscht.
            </p>
          </section>

          <section>
            <p className="text-sm text-muted-foreground">
              Stand: April 2026
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
