/**
 * Währung und Geldanzeige (PROJ-36)
 *
 * Bis zum 2026-08-07 rechnete die Anwendung überall in Euro, ohne das je zur
 * Wahl zu stellen. Für Halter in der Schweiz, in Skandinavien oder mit einem
 * britischen Klassiker waren damit sämtliche Kostenzahlen falsch beschriftet.
 *
 * Jedes Fahrzeug hat jetzt genau eine Währung. Alle selbst erfassten Beträge
 * dieses Fahrzeugs werden darin erfasst, angezeigt und summiert.
 *
 * ## Es wird an keiner Stelle umgerechnet
 *
 * Kein Tageskurs, keine Kursquelle, keine Kurshistorie — und das ist die
 * tragende Entscheidung dieser Datei, nicht eine Auslassung. Ein Kurs bringt
 * eine ganze Kette mit: Quelle, Stichtag je Betrag, Zwischenspeicher,
 * Verhalten bei Ausfall. Am Ende stünde in der Auswertung eine gerundete
 * Schätzung neben einem belegten Rechnungsbetrag, ohne dass man den beiden
 * ansieht, welche welche ist.
 *
 * Weil die Währung am *Fahrzeug* hängt und nicht am einzelnen Beleg, treffen
 * innerhalb einer Summe nie zwei Währungen aufeinander. Damit erübrigt sich
 * die ganze Kette.
 *
 * ## Diese Datei liegt hier und nicht in validations/service-entry.ts
 *
 * Der Geldformatierer wohnte bis zum 2026-08-07 in der Prüfdatei für
 * Scheckheft-Einträge und versorgte von dort 11 Komponenten — historisch
 * gewachsen, sachlich am falschen Ort.
 */

/**
 * Die neun wählbaren Währungen.
 *
 * Bewusst kurz. Die Anwendung gibt es nur auf Deutsch; eine Liste mit 180
 * ISO-Einträgen wäre eine Suchaufgabe für einen Fall, den es nicht gibt.
 * Reihenfolge nach Wahrscheinlichkeit, nicht alphabetisch — EUR, CHF und GBP
 * decken die realistischen Fälle ab und stehen deshalb oben.
 *
 * Erweitern ist jederzeit möglich, ohne bestehende Daten anzufassen: Es wird
 * nichts umgerechnet, also hängt an dieser Liste keine Historie.
 */
export const CURRENCIES = [
  { code: "EUR", name: "Euro" },
  { code: "CHF", name: "Schweizer Franken" },
  { code: "GBP", name: "Britisches Pfund" },
  { code: "USD", name: "US-Dollar" },
  { code: "SEK", name: "Schwedische Krone" },
  { code: "DKK", name: "Dänische Krone" },
  { code: "NOK", name: "Norwegische Krone" },
  { code: "PLN", name: "Polnischer Złoty" },
  { code: "CZK", name: "Tschechische Krone" },
] as const;

export type Currency = (typeof CURRENCIES)[number]["code"];

/**
 * Was gilt, wenn nichts gewählt wurde.
 *
 * Das ist zugleich der gesamte Migrationsplan: Alle vor dem 2026-08-07
 * angelegten Fahrzeuge werden dadurch zu Euro-Fahrzeugen — was sie faktisch
 * immer waren. Niemand muss etwas bestätigen oder nachtragen.
 */
export const DEFAULT_CURRENCY: Currency = "EUR";

const CURRENCY_CODES = new Set<string>(CURRENCIES.map((c) => c.code));

/**
 * Nimmt entgegen, was aus der Datenbank kommt, und gibt eine gültige Währung
 * zurück.
 *
 * Fremde oder fehlende Codes werden zu EUR. Das ist die richtige Antwort für
 * `null` (Zeilen von vor der Einführung) und die einzig mögliche für einen
 * Code, den die Anzeige nicht kennt — die Alternative wäre eine Seite, die
 * gar nicht lädt.
 */
export function toCurrency(value: string | null | undefined): Currency {
  return value && CURRENCY_CODES.has(value)
    ? (value as Currency)
    : DEFAULT_CURRENCY;
}

export function getCurrencyName(currency: Currency): string {
  return CURRENCIES.find((c) => c.code === currency)?.name ?? currency;
}

/** „CHF — Schweizer Franken" für Auswahllisten */
export function getCurrencyLabel(currency: Currency): string {
  return `${currency} — ${getCurrencyName(currency)}`;
}

/**
 * Formatiert Kleinsteinheiten (Cent, Rappen, Pence, Öre …) zur Anzeige.
 *
 * Die Währung ist **Pflichtangabe und hat bewusst keinen Vorgabewert.** Ein
 * Vorgabewert hieße: Wer sie vergisst, bekommt schweigend Euro angezeigt —
 * und niemandem fällt auf, dass die Zahl daneben in Franken erfasst wurde.
 * So bricht jede vergessene Stelle sofort und sichtbar beim Übersetzen.
 *
 * Die Zahlenformatierung bleibt deutsch (Punkt als Tausender-, Komma als
 * Dezimaltrenner). Nur der Währungsteil wechselt — die Anwendung gibt es nur
 * auf Deutsch, ein Franken-Betrag wird hier also weiter deutsch geschrieben.
 */
export function formatMoney(cents: number, currency: Currency): string {
  return (cents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency,
  });
}

/**
 * Formatiert einen Betrag, der bereits in ganzen Einheiten vorliegt.
 *
 * Gibt es, weil die Marktanalyse (PROJ-11) als einzige in Euro statt in Cent
 * rechnet. Sie stammt aus einer fremden Quelle und bleibt Euro — siehe
 * `EXTERNAL_CURRENCY`.
 */
export function formatMoneyUnits(
  amount: number,
  currency: Currency,
  optionen?: { ohneNachkomma?: boolean }
): string {
  return amount.toLocaleString("de-DE", {
    style: "currency",
    currency,
    // Für Schwellenwerte („Preise unter 500 €") sind Nachkommastellen
    // Scheingenauigkeit: „unter 500,00 €" liest sich wie ein exakter Betrag,
    // gemeint ist aber eine runde Grenze.
    ...(optionen?.ohneNachkomma
      ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
      : {}),
  });
}

/**
 * Nur das Symbol, für Eingabefelder.
 *
 * Am Feld muss die Währung stehen, **bevor** der Nutzer tippt — nicht erst im
 * Ergebnis. Sonst tippt er 1.000 und erfährt hinterher, in welcher Währung
 * das gemeint war.
 *
 * Für die meisten Währungen liefert der Browser hier ein echtes Zeichen
 * (€, CHF, £, $); wo es keines gibt, den Code. Beides ist brauchbar.
 */
export function getCurrencySymbol(currency: Currency): string {
  const parts = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).formatToParts(0);
  return parts.find((p) => p.type === "currency")?.value ?? currency;
}

/**
 * Was **nicht** in Fahrzeugwährung angezeigt wird.
 *
 * Die Ersatzteil-Angebote (PROJ-9) und die Marktpreis-Analyse (PROJ-11)
 * stammen aus dem deutschen Markt und sind dort in Euro ausgezeichnet. Sie
 * bei einem Franken-Fahrzeug als Franken zu beschriften wäre eine falsche
 * Behauptung über einen fremden Marktplatz — die Zahl wäre dieselbe, die
 * Aussage aber falsch.
 *
 * Diese Konstante existiert, damit an den betroffenen Stellen sichtbar ist,
 * dass Euro dort eine *Entscheidung* ist und kein vergessener Umbau.
 */
export const EXTERNAL_CURRENCY: Currency = "EUR";
