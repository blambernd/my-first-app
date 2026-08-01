import Link from "next/link";
import { BrandLogoWithText } from "@/components/brand-logo";


export default function ImpressumPage() {
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
        <h1 className="text-3xl font-bold mb-8">Impressum</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Angaben gemäß § 5 DDG</h2>
            <p>
              Bernhard Lambernd<br />
              Hans-Mayer-Siedlung 58<br />
              21502 Geesthacht
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Kontakt</h2>
            <p>
              E-Mail:{" "}
              <a
                href="mailto:b.lambernd@gmail.com"
                className="text-primary underline"
              >
                b.lambernd@gmail.com
              </a>
            </p>
            <p>
              Alternativ können Sie uns über unser{" "}
              <Link
                href="/kontakt"
                className="text-primary underline"
              >
                Kontaktformular
              </Link>{" "}
              erreichen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
            <p>
              Bernhard Lambernd<br />
              Hans-Mayer-Siedlung 58<br />
              21502 Geesthacht
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">EU-Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur
              Online-Streitbeilegung (OS) bereit. Die Plattform finden Sie unter{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
              . Wir sind nicht bereit oder verpflichtet, an
              Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
              teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Haftung für Inhalte</h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte
              auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
              §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet,
              übermittelte oder gespeicherte fremde Informationen zu überwachen oder
              nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit
              hinweisen.
            </p>
            <p>
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
              Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
              Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der
              Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden
              von entsprechenden Rechtsverletzungen werden wir diese Inhalte
              umgehend entfernen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Haftung für Links</h2>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren
              Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
              fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
              verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
              Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
              Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
              Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
            </p>
            <p>
              Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch
              ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei
              Bekanntwerden von Rechtsverletzungen werden wir derartige Links
              umgehend entfernen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Urheberrecht</h2>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
              Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
              Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
              Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des
              jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite
              sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
            </p>
            <p>
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt
              wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden
              Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf
              eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen
              entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen
              werden wir derartige Inhalte umgehend entfernen.
            </p>
          </section>
        </div>
      </main>

    </div>
  );
}
