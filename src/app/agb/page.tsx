import Link from "next/link";
import { BrandLogoWithText } from "@/components/brand-logo";

export default function AGBPage() {
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
        <h1 className="text-3xl font-bold mb-8">
          Allgemeine Geschäftsbedingungen (AGB)
        </h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-sm text-muted-foreground">Stand: 10. April 2026</p>

          <section>
            <h2 className="text-xl font-semibold mb-3">§ 1 Geltungsbereich</h2>
            <p>
              (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend
              &quot;AGB&quot;) gelten für die Nutzung der Plattform
              &quot;Oldtimer Docs&quot; (nachfolgend &quot;Plattform&quot;),
              betrieben von Bernhard Lambernd, Hans-Mayer-Siedlung 58, 21502
              Geesthacht (nachfolgend &quot;Betreiber&quot;).
            </p>
            <p>
              (2) Die Plattform ermöglicht es registrierten Nutzern, die
              Historie ihrer Oldtimer-Fahrzeuge digital zu dokumentieren,
              Wartungen und Restaurierungen zu erfassen sowie Dokumente zu
              archivieren.
            </p>
            <p>
              (3) Abweichende oder ergänzende Bedingungen des Nutzers werden
              nicht Vertragsbestandteil, es sei denn, der Betreiber stimmt ihrer
              Geltung ausdrücklich schriftlich zu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              § 2 Registrierung und Nutzerkonto
            </h2>
            <p>
              (1) Die Nutzung der Plattform erfordert eine Registrierung. Der
              Nutzer ist verpflichtet, bei der Registrierung wahrheitsgemäße und
              vollständige Angaben zu machen.
            </p>
            <p>
              (2) Jeder Nutzer darf nur ein Nutzerkonto anlegen. Das Nutzerkonto
              ist nicht übertragbar.
            </p>
            <p>
              (3) Der Nutzer ist für die Geheimhaltung seiner Zugangsdaten
              verantwortlich und haftet für alle Aktivitäten, die unter seinem
              Konto erfolgen.
            </p>
            <p>
              (4) Der Nutzer ist verpflichtet, den Betreiber unverzüglich zu
              informieren, wenn er Kenntnis von einer unbefugten Nutzung seines
              Kontos erlangt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              § 3 Leistungsbeschreibung
            </h2>
            <p>
              (1) Die Plattform bietet folgende Kernfunktionen:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Erstellung und Verwaltung digitaler Fahrzeugprofile</li>
              <li>Digitales Scheckheft für Wartungen und Reparaturen</li>
              <li>Dokumenten-Archiv für Rechnungen, Gutachten und Zertifikate</li>
              <li>Fahrzeug-Timeline zur chronologischen Historienübersicht</li>
              <li>Teilbare Fahrzeug-Kurzprofile</li>
            </ul>
            <p>
              (2) Der Betreiber stellt die Plattform in der jeweils aktuellen
              Version zur Verfügung. Ein Anspruch auf bestimmte Funktionen oder
              eine bestimmte Verfügbarkeit besteht nicht.
            </p>
            <p>
              (3) Der Betreiber ist berechtigt, den Funktionsumfang der
              Plattform jederzeit zu erweitern, einzuschränken oder zu ändern.
              Wesentliche Einschränkungen werden den Nutzern rechtzeitig
              mitgeteilt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              § 4 Kostenlose und kostenpflichtige Nutzung
            </h2>
            <p>
              (1) Die Plattform bietet einen kostenlosen Basistarif
              (&quot;Free&quot;) mit eingeschränktem Funktionsumfang sowie
              kostenpflichtige Tarife (&quot;Premium&quot;) mit erweiterten
              Funktionen.
            </p>
            <p>
              (2) Die aktuellen Tarife und enthaltenen Leistungen sind auf der
              Plattform einsehbar. Preisänderungen werden den Nutzern
              mindestens 4 Wochen vor Inkrafttreten mitgeteilt.
            </p>
            <p>
              (3) Kostenpflichtige Tarife werden im Voraus abgerechnet. Die
              Zahlung erfolgt über die auf der Plattform angebotenen
              Zahlungsmittel.
            </p>
            <p>
              (4) Bei kostenpflichtigen Tarifen besteht ein 14-tägiges
              Widerrufsrecht ab Vertragsschluss gemäß § 10 dieser AGB.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              § 5 Pflichten des Nutzers
            </h2>
            <p>(1) Der Nutzer verpflichtet sich:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                die Plattform nur für die vorgesehenen Zwecke zu nutzen
              </li>
              <li>
                keine rechtswidrigen, beleidigenden oder irreführenden Inhalte
                hochzuladen
              </li>
              <li>
                keine Inhalte hochzuladen, die Rechte Dritter (insbesondere
                Urheberrechte) verletzen
              </li>
              <li>
                die Plattform nicht in einer Weise zu nutzen, die den Betrieb
                beeinträchtigt
              </li>
              <li>
                keine automatisierten Zugriffe (Bots, Scraper) auf die Plattform
                durchzuführen
              </li>
            </ul>
            <p>
              (2) Der Nutzer trägt die alleinige Verantwortung für die von ihm
              eingestellten Inhalte und Daten.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              § 6 Nutzungsrechte und geistiges Eigentum
            </h2>
            <p>
              (1) Der Nutzer behält alle Rechte an den von ihm hochgeladenen
              Inhalten (Texte, Bilder, Dokumente). Er räumt dem Betreiber ein
              einfaches, nicht übertragbares Nutzungsrecht ein, soweit dies für
              die Erbringung der Plattform-Dienste erforderlich ist.
            </p>
            <p>
              (2) Alle Rechte an der Plattform selbst (Design, Software, Marken)
              verbleiben beim Betreiber.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              § 7 Verfügbarkeit und Wartung
            </h2>
            <p>
              (1) Der Betreiber bemüht sich um eine möglichst hohe
              Verfügbarkeit der Plattform, garantiert jedoch keine
              ununterbrochene Erreichbarkeit.
            </p>
            <p>
              (2) Wartungsarbeiten, die zu vorübergehenden Einschränkungen
              führen, werden nach Möglichkeit vorab angekündigt.
            </p>
            <p>
              (3) Der Betreiber haftet nicht für Ausfälle, die durch höhere
              Gewalt, technische Störungen Dritter (z.&nbsp;B. Hosting-Anbieter)
              oder Umstände außerhalb seines Einflussbereichs verursacht werden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">§ 8 Haftung</h2>
            <p>
              (1) Der Betreiber haftet unbeschränkt für Schäden aus der
              Verletzung des Lebens, des Körpers oder der Gesundheit sowie für
              Vorsatz und grobe Fahrlässigkeit.
            </p>
            <p>
              (2) Bei leichter Fahrlässigkeit haftet der Betreiber nur bei
              Verletzung wesentlicher Vertragspflichten
              (Kardinalpflichten). Die Haftung ist in diesem Fall auf den
              vorhersehbaren, vertragstypischen Schaden begrenzt.
            </p>
            <p>
              (3) Die Plattform dient ausschließlich der Dokumentation.
              Der Betreiber übernimmt keine Haftung für die Richtigkeit,
              Vollständigkeit oder Aktualität der vom Nutzer eingegebenen Daten.
            </p>
            <p>
              (4) Der Betreiber übernimmt keine Haftung für den Verlust von
              Daten, soweit der Nutzer es versäumt hat, eigene Sicherungskopien
              zu erstellen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              § 9 Vertragslaufzeit und Kündigung
            </h2>
            <p>
              (1) Der Vertrag über die kostenlose Nutzung wird auf unbestimmte
              Zeit geschlossen und kann von beiden Seiten jederzeit ohne Angabe
              von Gründen gekündigt werden.
            </p>
            <p>
              (2) Kostenpflichtige Tarife haben die auf der Plattform
              angegebene Laufzeit und verlängern sich automatisch um den gleichen
              Zeitraum, sofern nicht vor Ablauf gekündigt wird. Die Kündigungsfrist
              beträgt 14 Tage zum Ende der jeweiligen Laufzeit.
            </p>
            <p>
              (3) Der Nutzer kann sein Konto jederzeit in den Kontoeinstellungen
              löschen. Mit Löschung des Kontos werden alle gespeicherten Daten
              unwiderruflich entfernt, sofern keine gesetzlichen
              Aufbewahrungspflichten entgegenstehen.
            </p>
            <p>
              (4) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund
              bleibt unberührt. Ein wichtiger Grund liegt insbesondere vor, wenn
              der Nutzer gegen diese AGB verstößt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              § 10 Widerrufsrecht für Verbraucher
            </h2>
            <p>
              (1) Verbraucher haben das Recht, einen kostenpflichtigen Vertrag
              innerhalb von 14 Tagen ohne Angabe von Gründen zu widerrufen.
            </p>
            <p>
              (2) Die Widerrufsfrist beträgt 14 Tage ab dem Tag des
              Vertragsschlusses. Zur Wahrung der Widerrufsfrist genügt die
              rechtzeitige Absendung des Widerrufs.
            </p>
            <p>
              (3) Der Widerruf kann formlos erfolgen, z.&nbsp;B. per E-Mail an:{" "}
              <a
                href="mailto:b.lambernd@gmail.com"
                className="text-primary underline"
              >
                b.lambernd@gmail.com
              </a>
            </p>
            <p>
              (4) Im Falle eines wirksamen Widerrufs werden bereits geleistete
              Zahlungen unverzüglich, spätestens innerhalb von 14 Tagen,
              erstattet.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">§ 11 Datenschutz</h2>
            <p>
              Die Erhebung und Verarbeitung personenbezogener Daten erfolgt
              gemäß unserer{" "}
              <Link
                href="/datenschutz"
                className="text-primary underline"
              >
                Datenschutzerklärung
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              § 12 Änderungen der AGB
            </h2>
            <p>
              (1) Der Betreiber behält sich vor, diese AGB mit Wirkung für die
              Zukunft zu ändern. Nutzer werden über Änderungen mindestens 4
              Wochen vor Inkrafttreten per E-Mail informiert.
            </p>
            <p>
              (2) Widerspricht der Nutzer den geänderten AGB nicht innerhalb von
              4 Wochen nach Zugang der Änderungsmitteilung, gelten die
              geänderten AGB als akzeptiert. Der Nutzer wird in der
              Änderungsmitteilung auf diese Rechtsfolge hingewiesen.
            </p>
            <p>
              (3) Im Falle eines Widerspruchs steht beiden Seiten ein
              Sonderkündigungsrecht zu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              § 13 Schlussbestimmungen
            </h2>
            <p>
              (1) Es gilt das Recht der Bundesrepublik Deutschland unter
              Ausschluss des UN-Kaufrechts. Gegenüber Verbrauchern gilt diese
              Rechtswahl nur insoweit, als nicht zwingende Bestimmungen des
              Rechts des Staates, in dem der Verbraucher seinen gewöhnlichen
              Aufenthalt hat, entgegenstehen.
            </p>
            <p>
              (2) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder
              werden, bleibt die Wirksamkeit der übrigen Bestimmungen
              unberührt.
            </p>
            <p>
              (3) Gerichtsstand für alle Streitigkeiten aus oder im
              Zusammenhang mit diesen AGB ist, soweit gesetzlich zulässig,
              Geesthacht.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
