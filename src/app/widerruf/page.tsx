import Link from "next/link";
import { BrandLogoWithText } from "@/components/brand-logo";

export default function WiderrufPage() {
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
        <h1 className="text-3xl font-bold mb-8">Widerrufsbelehrung</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-sm text-muted-foreground">
            Stand: 10. April 2026
          </p>

          <section>
            <h2 className="text-xl font-semibold mb-3">Widerrufsrecht</h2>
            <p>
              Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen
              diesen Vertrag zu widerrufen.
            </p>
            <p>
              Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des
              Vertragsschlusses.
            </p>
            <p>
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
            </p>
            <p className="pl-4 border-l-2 border-muted">
              Bernhard Lambernd
              <br />
              Hans-Mayer-Siedlung 58
              <br />
              21502 Geesthacht
              <br />
              E-Mail:{" "}
              <a
                href="mailto:b.lambernd@gmail.com"
                className="text-primary underline"
              >
                b.lambernd@gmail.com
              </a>
            </p>
            <p>
              mittels einer eindeutigen Erklärung (z.&nbsp;B. ein mit der Post
              versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen
              Vertrag zu widerrufen, informieren. Sie können dafür das
              beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht
              vorgeschrieben ist.
            </p>
            <p>
              Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die
              Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der
              Widerrufsfrist absenden.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Folgen des Widerrufs
            </h2>
            <p>
              Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle
              Zahlungen, die wir von Ihnen erhalten haben, einschließlich der
              Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich
              daraus ergeben, dass Sie eine andere Art der Lieferung als die von
              uns angebotene, günstigste Standardlieferung gewählt haben),
              unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag
              zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses
              Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden
              wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen
              Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde
              ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen
              wegen dieser Rückzahlung Entgelte berechnet.
            </p>
            <p>
              Haben Sie verlangt, dass die Dienstleistungen während der
              Widerrufsfrist beginnen sollen, so haben Sie uns einen
              angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem
              Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts
              hinsichtlich dieses Vertrags unterrichten, bereits erbrachten
              Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag
              vorgesehenen Dienstleistungen entspricht.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              Muster-Widerrufsformular
            </h2>
            <p className="text-sm text-muted-foreground">
              (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte
              dieses Formular aus und senden Sie es zurück.)
            </p>
            <div className="rounded-md border p-6 space-y-4 bg-muted/30">
              <p>
                An:
                <br />
                Bernhard Lambernd
                <br />
                Hans-Mayer-Siedlung 58
                <br />
                21502 Geesthacht
                <br />
                E-Mail: b.lambernd@gmail.com
              </p>
              <p>
                Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*)
                abgeschlossenen Vertrag über die Erbringung der folgenden
                Dienstleistung (*):
              </p>
              <p className="border-b border-dashed pb-2">
                _______________________________________________
              </p>
              <p>Bestellt am (*) / erhalten am (*):</p>
              <p className="border-b border-dashed pb-2">
                _______________________________________________
              </p>
              <p>Name des/der Verbraucher(s):</p>
              <p className="border-b border-dashed pb-2">
                _______________________________________________
              </p>
              <p>Anschrift des/der Verbraucher(s):</p>
              <p className="border-b border-dashed pb-2">
                _______________________________________________
              </p>
              <p className="pt-4">
                _______________________________________________
                <br />
                <span className="text-sm text-muted-foreground">
                  Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf
                  Papier)
                </span>
              </p>
              <p>
                _______________________________________________
                <br />
                <span className="text-sm text-muted-foreground">Datum</span>
              </p>
              <p className="text-xs text-muted-foreground">
                (*) Unzutreffendes streichen.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
