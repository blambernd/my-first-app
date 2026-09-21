# PROJ-39: Werkstatt-Konto & Kundenfahrzeuge

## Status: Deployed
**Created:** 2026-09-21
**Last Updated:** 2026-09-21

## Dependencies
- Requires: PROJ-1 (User Authentication) — Kontobezug der Selbstdeklaration
- Requires: PROJ-2 (Fahrzeugprofil) — Kundenfahrzeuge sind reguläre Fahrzeuge der Werkstatt
- Requires: PROJ-37 (Werkstatt-Dashboard) — die Ansicht, die hier einen zweiten Bereich bekommt
- Requires: PROJ-8 (Freemium-Modell) — das Fahrzeuglimit des Tarifs gilt unverändert weiter
- Führt zu: PROJ-40 (Übergabe an den Kunden) — ohne PROJ-40 hat die Werkstatt keinen Grund, Fahrzeuge hier anzulegen
- Vorbild: PROJ-38 (Händler-Bestandsübersicht) — dieselbe Bauart der Selbstdeklaration

## Kontext
Der Zugang zur Werkstattrolle führt heute ausschließlich über eine Einladung des Fahrzeugbesitzers (PROJ-6). Das setzt voraus, dass der Kunde die Plattform bereits nutzt — und macht die Werkstatt zum Nachzügler statt zum Türöffner.

Dieses Feature dreht die Richtung um: Eine Werkstatt deklariert sich selbst als solche und legt Fahrzeuge ihrer Kunden eigenständig an, auch wenn der Kunde noch kein Konto hat. Sie dokumentiert daran die Arbeit, die sie ohnehin leistet. Die Übergabe an den Kunden regelt PROJ-40.

## Was dieses Feature ausdrücklich NICHT ändert (verbindlich)
Die Selbstdeklaration gibt **keinerlei Zugriff auf fremde Fahrzeuge**. Wer den Schalter umlegt, erhält:

- eine zusätzliche Ansicht
- das Recht, **eigene** Fahrzeuge anzulegen — das hat jeder Nutzer ohnehin

Der Zugriff auf Fahrzeuge, die einem anderen Nutzer gehören, bleibt **ausschließlich** an die Einladung des Besitzers gebunden (PROJ-6, Non-Goal aus PROJ-37). Jede Umsetzung, die aus der Deklaration einen Leseweg auf fremde Daten ableitet, ist abzulehnen. Genau deshalb ist die Deklaration ungeprüft möglich: Eine falsche Angabe verschafft niemandem einen Vorteil.

## User Stories
- Als Werkstatt möchte ich mich in den Einstellungen als Werkstatt zu erkennen geben, damit ich die passende Ansicht bekomme, ohne auf eine Einladung zu warten
- Als Werkstatt möchte ich Fahrzeuge meiner Kunden selbst anlegen, damit ich die Wartung dokumentieren kann, bevor der Kunde ein Konto hat
- Als Werkstatt möchte ich zu jedem Kundenfahrzeug vermerken können, wem es gehört, damit ich bei vielen Fahrzeugen nicht den Überblick verliere
- Als Werkstatt möchte ich meine selbst angelegten Kundenfahrzeuge getrennt von den Fahrzeugen sehen, zu denen ich eingeladen wurde, damit ich weiß, wo ich Besitzer bin und wo Gast
- Als Werkstatt möchte ich die Werkstattansicht wieder abschalten können, wenn ich sie nicht mehr brauche, ohne dass Daten verloren gehen
- Als privater Nutzer möchte ich von alldem nichts sehen, damit die Anwendung für mich einfach bleibt

## Acceptance Criteria

### Zugang
- [ ] In den Einstellungen existiert ein Schalter „Ich bin eine Werkstatt" (Standard: aus)
- [ ] Der Schalter ist ohne Prüfung, Freischaltung oder Nachweis bedienbar
- [ ] Ist der Schalter aus, verhält sich die Anwendung exakt wie bisher
- [ ] Ist der Schalter an, erscheint der Navigationspunkt „Werkstatt" — auch ohne eine einzige Einladung
- [ ] Wer über eine Einladung die Werkstattrolle an einem Fahrzeug hat, sieht den Navigationspunkt weiterhin ohne Schalter (bestehendes Verhalten aus PROJ-37 bleibt unverändert)
- [ ] Der Schalter kann jederzeit ausgeschaltet werden; dabei gehen keine Daten verloren, der Bereich wird nur ausgeblendet
- [ ] Das Ausschalten ändert nichts an der Besitzerschaft der angelegten Fahrzeuge — sie bleiben im normalen Dashboard sichtbar

### Kundenfahrzeuge anlegen
- [ ] Die Werkstatt kann im Werkstattbereich ein Fahrzeug anlegen; es gelten dieselben Felder und Regeln wie bei einem eigenen Fahrzeug (PROJ-2)
- [ ] Die Werkstatt ist Besitzer dieses Fahrzeugs und hat daran alle Rechte
- [ ] An jedem Fahrzeug lässt sich ein Feld „Kunde" mit Name, Telefon und E-Mail hinterlegen
- [ ] Das Kundenfeld ist optional
- [ ] Das Kundenfeld ist ausschließlich für die Werkstatt sichtbar — nicht im öffentlichen Kurzprofil (PROJ-10), nicht für andere Mitglieder des Fahrzeugs
- [ ] Das bestehende Fahrzeuglimit des Tarifs gilt unverändert weiter; Kundenfahrzeuge zählen mit
- [ ] Ist das Limit erreicht, erscheint der Upgrade-Hinweis aus PROJ-8 wie bei jedem anderen Fahrzeug

### Ansicht
- [ ] Der Werkstattbereich trennt sichtbar zwei Gruppen: „Meine Kundenfahrzeuge" (Werkstatt ist Besitzer) und „Betreute Fahrzeuge" (per Einladung, Bestand aus PROJ-37)
- [ ] Beide Gruppen sind auch dann benannt, wenn eine davon leer ist
- [ ] Ist die Werkstatt bei einem Fahrzeug Besitzer, stehen ihr dort alle Aktionen offen; bei betreuten Fahrzeugen gelten unverändert die Rechte der Werkstattrolle aus PROJ-6
- [ ] Die Karte „Anstehende Arbeiten" aus PROJ-37 berücksichtigt beide Gruppen
- [ ] Der Kopfbereich zählt beide Gruppen getrennt aus

## Edge Cases
- Was passiert, wenn jemand ohne Werkstattbetrieb den Schalter umlegt? → Er bekommt eine andere Ansicht auf seine eigenen Fahrzeuge, sonst nichts. Kein Zugriff auf fremde Daten, kein zusätzliches Fahrzeugkontingent — die Angabe ist wertlos für Missbrauch
- Was passiert, wenn eine Werkstatt zugleich Händler ist (Schalter aus PROJ-38 ebenfalls an)? → Beide Navigationspunkte erscheinen; ein Fahrzeug kann in beiden Ansichten auftauchen. Die Schalter sind unabhängig voneinander
- Was passiert, wenn die Werkstatt ein Fahrzeug anlegt, das der Kunde bereits selbst angelegt hat? → Es entstehen zwei getrennte Fahrzeuge. Die Anwendung erkennt das nicht und soll es in dieser Ausbaustufe auch nicht erraten; die Zusammenführung ist Sache der Übergabe (PROJ-40) beziehungsweise des Kunden
- Was passiert mit den Kundendaten, wenn das Fahrzeug übergeben wird? → Siehe PROJ-40: Das Kundenfeld wird nicht mitübertragen
- Was passiert, wenn die Werkstatt ihr Konto löscht? → Wie bei jedem Besitzer: Fahrzeuge und Verknüpfungen werden gelöscht. Der Hinweis auf die Übergabe vor dem Löschen gilt hier besonders, weil fremde Fahrzeughistorie betroffen ist
- Was passiert, wenn die Werkstatt den Schalter ausschaltet, während sie 40 Kundenfahrzeuge besitzt? → Die Fahrzeuge bleiben unverändert ihr Eigentum und erscheinen im normalen Dashboard. Nur die Werkstattansicht verschwindet

## Offene Punkte für die Architektur
- **Datenschutz:** Die Werkstatt legt personenbezogene Daten Dritter an (Kennzeichen, FIN, Kundenname), bevor der Betroffene zugestimmt hat. Sie ist dafür Verantwortlicher, die Plattform Auftragsverarbeiter. Zu klären: AV-Vertrag beim Umlegen des Schalters, Hinweistext, Löschfristen für nie übergebene Fahrzeuge
- **Tarif:** Das Limit bleibt in dieser Spec bewusst unverändert. Eine Werkstatt mit 60 Kundenfahrzeugen ist damit praktisch ausgeschlossen — das ist so gewollt, bis der Gewerbetarif entschieden ist (vorgemerkt als PROJ-42)
- **Mitarbeiter:** Ein Werkstattbetrieb ist kein Einzelnutzer. Mehrere Mitarbeiter an einem Konto sind nicht vorgesehen und in dieser Ausbaustufe kein Ziel

## Technical Requirements
- Security: Die Deklaration darf an keiner Stelle als Berechtigung auf fremde Daten ausgewertet werden
- Security: Das Kundenfeld unterliegt derselben Zugriffsregel wie das Fahrzeug, zusätzlich beschränkt auf den Besitzer
- Performance: Die Werkstattansicht lädt beide Gruppen in einer Abfrage (Fortführung von PROJ-37)

## Implementation Notes (Frontend)

**Stand:** 2026-09-21 — Oberfläche gebaut, Backend-Teil steht aus.

### Neue Dateien
- `src/lib/workshop-customers.ts` — Laden der eigenen Kundenfahrzeuge samt Kundenangabe, Suche, Anzeigename des Kunden
- `src/components/workshop-mode-settings.tsx` — Schalter „Ich bin eine Werkstatt" (Vorbild: `dealer-mode-settings.tsx`)
- `src/components/workshop-customer-vehicle-list.tsx` — Liste der selbst angelegten Kundenfahrzeuge
- `src/components/vehicle-customer-card.tsx` — Kundenangabe am Fahrzeug, nur für Werkstatt und Besitzer

### Geänderte Dateien
- `src/lib/workshop-access.ts` — `isWorkshop()` ergänzt
- `src/lib/navigation-access.ts` — der Navigationspunkt erscheint jetzt bei Einladung **oder** Selbstauskunft
- `src/app/settings/page.tsx` — Karte eingebunden
- `src/app/werkstatt/page.tsx` — zweigeteilt, siehe unten
- `src/app/vehicles/[id]/page.tsx` — Kundenangabe eingebunden

### Der Umbau der Werkstattseite
Die Seite leitete bisher ins Dashboard um, sobald jemand kein betreutes Fahrzeug hatte. Für eine Werkstatt, die gerade erst anfängt, wäre das eine geschlossene Tür gewesen: Sie hat noch keine Einladung und käme nie an die Seite, auf der sie ihr erstes Kundenfahrzeug anlegen könnte. Die Umleitung greift jetzt nur noch, wenn **beide** Wege verschlossen sind.

Zwei Eigenschaften der alten Fassung wurden dabei bewusst erhalten:
- Der Ausfall der Übersicht (QA BUG-1 aus PROJ-37) zeigt weiterhin eine Meldung statt einer stummen Umleitung — jetzt sogar besser, weil die eigenen Kundenfahrzeuge daneben trotzdem erscheinen
- Die Kürzungswarnung bei mehr als 100 betreuten Fahrzeugen (QA BUG-3) bleibt unverändert

Die Abfrage der betreuten Fahrzeuge läuft nur noch, wenn es welche gibt. Eine reine Werkstatt ohne Einladungen spart sich damit einen Aufruf.

### Was noch nicht funktioniert
Die Oberfläche ist vollständig, aber **zwei Dinge in der Datenbank fehlen** und werden im Backend-Schritt angelegt:
- `subscriptions.is_workshop` — bis dahin lässt sich der Schalter nicht speichern
- Tabelle `vehicle_customers` — bis dahin lässt sich keine Kundenangabe speichern

Beide Zugriffe sind defensiv gebaut: Fehlt die Spalte oder die Tabelle, wird das als „keine Werkstatt" beziehungsweise „keine Kundenangabe" behandelt. Die Anwendung läuft dadurch unverändert weiter, statt Seiten scheitern zu lassen — dasselbe Vorgehen wie bei PROJ-38.

### Beobachtung für die Abnahme
Der Abschnitt „Meine Kundenfahrzeuge" zeigt **alle** Fahrzeuge, bei denen die Werkstatt Besitzer ist. Hat der Werkstattinhaber einen eigenen Oldtimer im selben Konto, steht der dort zwischen den Kundenfahrzeugen. Das entspricht der Spezifikation und dem Verhalten der Händler-Bestandsübersicht, kann im Alltag aber stören. Eine Unterscheidung bräuchte ein zusätzliches Merkmal am Fahrzeug — bewusst nicht gebaut, aber vermerkt.

### Geprüft
- `npm run build` erfolgreich
- `npm run lint` ohne Fehler
- `npm test` — 793 Tests, alle grün (keine Regression)
- Typprüfung ohne Fehler außerhalb zweier vorbestehender Testdateien

## Implementation Notes (Backend)

**Stand:** 2026-09-21 — Migration eingespielt und geprüft.

### Migration `20260921_proj39_werkstatt_kundenfahrzeuge.sql`
- `subscriptions.is_workshop` (BOOLEAN NOT NULL DEFAULT false)
- Tabelle `vehicle_customers` — Kundenangabe je Fahrzeug, Primärschlüssel ist die Fahrzeugkennung
- Vier Zugriffsregeln (SELECT, INSERT, UPDATE, DELETE), alle mit derselben Bedingung: **Gehört das Fahrzeug dem Anfragenden?**
- Auslöser, der `updated_at` mitführt

### Die Zugriffsregel prüft den Besitzer, nicht die Rolle
Die vier Regeln fragen direkt `vehicles.user_id = auth.uid()` ab und **nicht** über `get_user_vehicle_role`. Das ist der entscheidende Unterschied: Jene Funktion kennt auch Mitglieder — und genau die sollen die Kundenangabe nicht sehen. Wer hier auf die bequemere Funktion wechselt, öffnet den Kundennamen für Betrachter, eingeladene Werkstätten und den neuen Besitzer nach einer Übergabe.

### Längenbegrenzungen
Name 120, Telefon 40, E-Mail 200 Zeichen — als Prüfbedingung in der Datenbank, nicht nur im Formular. Sie sind keine fachliche Aussage, sondern verhindern, dass jemand die Tabelle als Ablage missbraucht.

### Eingespielt am 2026-09-21
Angewendet über die Management-Schnittstelle, danach nachgeprüft:

| Prüfung | Ergebnis |
|---|---|
| `subscriptions.is_workshop` | vorhanden |
| Tabelle `vehicle_customers` | vorhanden, alle Spalten |
| RLS aktiv | ja |
| Zugriffsregeln | vier (SELECT, INSERT, UPDATE, DELETE) |
| Unangemeldeter Zugriff | liefert nichts |
| `search_path` des Auslösers | fest auf `public` gesetzt |

Der letzte Punkt ist kein Formalismus: Eine Funktion ohne festen `search_path` hat am 2026-08-06 die gesamte Registrierung lahmgelegt, und es fiel sechs Wochen lang niemandem auf.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

**Erstellt:** 2026-09-21

### Braucht dieses Feature einen Backend-Teil?
Ja, aber einen kleinen. Drei Dinge müssen in der Datenbank abgelegt werden: die Angabe am Konto, die Kundenangaben je Fahrzeug und die Zugriffsregel dazu. Alles andere ist Oberfläche auf bereits vorhandenen Daten.

### Aufbau der Oberfläche

```
Einstellungen (bestehende Seite)
+-- Karte "Werkstatt" (neu)
    +-- Schalter "Ich bin eine Werkstatt"
    +-- Erklärung, was der Schalter bewirkt — und was nicht
    +-- Hinweis zum Umgang mit Kundendaten

Werkstatt-Bereich (bestehende Seite aus PROJ-37, erweitert)
+-- Kopfbereich
|   +-- zählt jetzt zwei Gruppen getrennt statt einer
+-- Karte "Anstehende Arbeiten" (bestehend)
|   +-- speist sich künftig aus beiden Gruppen
+-- Abschnitt "Meine Kundenfahrzeuge" (neu)
|   +-- Schaltfläche "Kundenfahrzeug anlegen"
|   +-- Liste, je Zeile zusätzlich der hinterlegte Kunde
|   +-- Hinweis, wenn leer
+-- Abschnitt "Betreute Fahrzeuge" (bestehend, nur umbenannt)
    +-- unverändert die Liste aus PROJ-37

Fahrzeugseite (bestehend)
+-- Feld "Kunde" (neu, nur sichtbar wenn Werkstatt und Besitzer)
    +-- Name, Telefon, E-Mail
```

### Welche Informationen gespeichert werden

**Am Benutzerkonto** kommt eine einzelne Ja/Nein-Auskunft hinzu: „ist Werkstatt". Sie liegt neben der bereits vorhandenen Angabe „ist Händler" aus PROJ-38 an denselben Abo-Daten.

**Je Fahrzeug** kann eine Kundenangabe hinterlegt werden:
- Name des Kunden
- Telefonnummer
- E-Mail-Adresse
- alle drei freiwillig

Diese Angaben liegen **nicht am Fahrzeug selbst**, sondern getrennt davon. Das ist die wichtigste Entscheidung dieses Entwurfs, und sie hat einen einzigen Grund: Alles, was am Fahrzeug steht, können auch die Mitglieder des Fahrzeugs lesen — Betrachter, andere Werkstätten, und nach einer Übergabe der neue Besitzer. Die Spezifikation sagt zu, dass die Kundenangaben ausschließlich die Werkstatt sieht. Nur eine getrennte Ablage mit einer eigenen Regel „nur der Besitzer, sonst niemand" hält diese Zusage ein.

Als Nebenwirkung löst sich damit auch die Anforderung aus PROJ-40, die Angaben bei der Übergabe nicht mitzugeben: Sie werden an derselben Stelle entfernt, an der schon heute die Kostendaten des Vorbesitzers gelöscht werden.

### Technische Entscheidungen und ihre Begründung

**1. Die Werkstatt-Angabe wird wie die Händler-Angabe gebaut.**
Für den gewerblichen Bestand gibt es seit PROJ-38 genau dieses Muster: eine Ja/Nein-Angabe am Konto, eine kleine Abfragehilfe, eine Karte in den Einstellungen. Wir bauen daneben dasselbe noch einmal, statt etwas Eigenes zu erfinden. Das spart Arbeit und sorgt dafür, dass beide Schalter sich gleich verhalten — jemand kann beides sein, Werkstatt und Händler.

**2. Die eigenen Kundenfahrzeuge werden auf dem normalen Weg geladen, nicht über die Sonderfunktion aus PROJ-37.**
Die Werkstattansicht holt ihre betreuten Fahrzeuge heute über eine Sonderfunktion, die mit erhöhten Rechten arbeitet — nötig, weil sie auf fremde Fahrzeuge schaut. Für eigene Fahrzeuge braucht es das nicht: Die Werkstatt ist dort Besitzer, die normalen Zugriffsregeln genügen. Wir fassen die bestehende Sonderfunktion deshalb **nicht** an, sondern stellen eine zweite, einfache Abfrage daneben. Jede Änderung an einer Funktion mit erhöhten Rechten ist ein Sicherheitsrisiko, und hier ist sie unnötig.

**3. Zum Anlegen wird das vorhandene Fahrzeugformular genutzt.**
Ein Kundenfahrzeug ist technisch ein ganz normales Fahrzeug. Ein zweites Formular daneben würde nur Pflege kosten und mit der Zeit auseinanderlaufen.

**4. Der Schalter wird an keiner Stelle als Berechtigung ausgewertet.**
Das ist eine Bauvorschrift, keine Funktion: Die Angabe darf nur darüber entscheiden, welche Ansicht jemand sieht. Sie darf niemals Teil einer Prüfung sein, die Zugriff auf fremde Daten gewährt. Andernfalls wäre eine ungeprüfte Selbstauskunft der Schlüssel zu fremden Fahrzeughistorien.

**5. Das Fahrzeuglimit bleibt unangetastet.**
Kundenfahrzeuge zählen wie alle anderen. Damit ist der Schalter für einen Missbraucher wertlos — er bekommt kein zusätzliches Kontingent. Dass eine echte Werkstatt damit praktisch noch nicht arbeiten kann, ist bekannt und bewusst aufgeschoben (siehe offene Punkte).

### Zusätzliche Pakete
Keine. Alles wird mit den vorhandenen Bausteinen gebaut.

### Reihenfolge der Umsetzung
1. Backend: Angabe am Konto, Ablage für Kundenangaben, Zugriffsregeln
2. Frontend: Karte in den Einstellungen
3. Frontend: Zweiteilung der Werkstattansicht, Anlegen, Kundenfeld

Schritt 1 ist Voraussetzung für die beiden anderen. Die Schritte 2 und 3 sind voneinander unabhängig.

### Was dieser Entwurf offenlässt
- **Der Gewerbetarif.** Ohne ihn bleibt das Feature eine Demonstration: Mit einem Limit von wenigen Fahrzeugen legt keine Werkstatt einen echten Kundenbestand an. Vorgemerkt als PROJ-42.
- **Der Auftragsverarbeitungsvertrag.** Er gehört an den Schalter — zustimmen, bevor die erste fremde Fahrzeugakte entsteht. Er ist kein Entwicklungsthema, sondern muss vorliegen.
- **Mehrere Mitarbeiter je Betrieb.** Nicht vorgesehen; ein Betrieb teilt sich vorerst ein Konto.

## QA Test Results

**Geprüft:** 2026-09-21
**Ergebnis:** Beide Features sind geprüft. Alle Befunde der Stufen Kritisch und Hoch sind behoben; offen bleiben BUG-4 und BUG-5 (beide Mittel).

### Der blockierende Befund in einem Satz
Der Schalter „Ich bin eine Werkstatt" lässt sich **nicht speichern**. Damit ist PROJ-39 vollständig funktionslos, und PROJ-40 ist nicht prüfbar, weil sein Ankreuzfeld nur erklärten Werkstätten erscheint.

### BUG-1 (Kritisch) — Die Selbstauskunft lässt sich nicht speichern

**Zu beobachten:** Einstellungen öffnen, „Ich bin eine Werkstatt" einschalten. Es erscheint die Meldung „Werkstattbereich aktiviert", die Seite lädt neu — und der Schalter steht wieder auf aus.

**Ursache:** Die Tabelle `subscriptions` hat **keine UPDATE-Regel**. Das ist kein Versehen, sondern steht so in der Migration von PROJ-8:

```
-- Only server (service role) can insert/update/delete subscriptions
-- No INSERT/UPDATE/DELETE policies for anon role
```

Beide Schalter-Komponenten schreiben jedoch direkt aus dem Browser:

```
supabase.from("subscriptions").update({ is_workshop: next }).eq("user_id", userId)
```

**Nachgewiesen** mit einem echten Nutzerzugang gegen die Produktionsdatenbank:

| Schritt | Ergebnis |
|---|---|
| `PATCH /subscriptions?user_id=eq.…` mit `is_workshop: true` | **HTTP 200** |
| Antwortkörper | `[]` — keine Zeile geändert |
| Zustand danach | `is_workshop: false` |

**Warum der naheliegende Fix gefährlich wäre:** Eine UPDATE-Regel auf `subscriptions` gäbe dem Nutzer Schreibrecht auf die **ganze Zeile** — einschließlich `plan`. Jeder könnte sich selbst `premium` eintragen. Zeilenregeln können einzelne Spalten nicht ausnehmen. Die Auskunft gehört deshalb hinter eine Server-Route mit Dienstschlüssel, die genau dieses eine Feld setzt, oder hinter eine Datenbankfunktion, die nur diese Spalte anfasst.

### BUG-2 (Kritisch) — Derselbe Fehler betrifft PROJ-38 in Produktion

`dealer-mode-settings.tsx` schreibt auf demselben Weg. **Der Händler-Schalter funktioniert in Produktion nicht** — seit der Auslieferung am 2026-09-21 kann kein Nutzer den Bestandsbereich einschalten.

Warum es bei der Abnahme von PROJ-38 nicht auffiel: Das Merkmal wurde damals per SQL gesetzt, nicht über die Oberfläche. Von fünf Konten trägt genau eines `is_dealer = true` — das Testkonto.

**Dieser Befund gehört nicht zu PROJ-39 oder PROJ-40.** Er ist hier nur dokumentiert, weil er bei deren Prüfung gefunden wurde und dieselbe Behebung braucht.

### BUG-3 (Hoch) — Beide Schalter melden Erfolg, ohne gespeichert zu haben

Ein UPDATE, das wegen einer Zugriffsregel keine Zeile trifft, ist **kein Fehler**: PostgREST antwortet mit 200 und leerem Ergebnis. Beide Komponenten prüfen nur `error` und melden daraufhin Erfolg.

Das ist der Grund, warum BUG-2 ein halbes Jahr unentdeckt bleiben konnte: Die Anwendung behauptet genau das Gegenteil dessen, was geschehen ist. Eine Prüfung der Anzahl geänderter Zeilen hätte beides sofort sichtbar gemacht.

### BUG-4 (Mittel) — Geänderte Kopfzeile bricht einen ausgelieferten Test

Die Kopfzeile des Werkstattbereichs sagt jetzt „1 betreutes Fahrzeug" statt bisher „1 betreutes Kundenfahrzeug" — geändert, um eigene von betreuten Fahrzeugen zu unterscheiden. Der Test `PROJ-37-werkstattrolle.spec.ts:80` prüft die alte Formulierung und schlägt fehl.

Fachlich ist nichts kaputt. Zu entscheiden ist, ob der Text zurückgeht oder der Test nachzieht.

### BUG-5 (Mittel) — Ein Abschnitt von PROJ-40 ist nicht gebaut

Die Akzeptanzkriterien unter „Offene Übergaben" sind vollständig offen: keine Kennzeichnung „Übergabe offen", keine Empfängeradresse, kein Ablaufdatum, kein erneutes Anstoßen. Das war beim Bau bereits vermerkt.

### Was geprüft werden konnte

| Prüfung | Ergebnis |
|---|---|
| Schalter erscheint in den Einstellungen | bestanden |
| Erklärtext vorhanden | bestanden |
| Händler-Schalter steht weiterhin daneben | bestanden |
| Werkstattbereich über Navigation erreichbar | bestanden |
| Karte „Anstehende Arbeiten" erhalten (PROJ-37) | bestanden |
| Liste der betreuten Fahrzeuge erhalten (PROJ-37) | bestanden |
| **Ohne Selbstauskunft kein Bereich für eigene Fahrzeuge** | bestanden |
| Bedienbar bei 375 px, kein waagerechter Überlauf | bestanden |
| Datenbank: Tabelle, RLS, vier Zugriffsregeln | bestanden |
| Datenbank: genau eine Übergabefunktion, keine Mehrdeutigkeit | bestanden |
| Datenbank: Aufruf mit und ohne neuen Parameter | bestanden |
| Einheitentests | 813 grün |

Elf neue E2E-Tests in `tests/PROJ-39-werkstattrolle.spec.ts`, alle grün.

### Was nicht geprüft werden konnte

Alles, was hinter dem Schalter liegt — und das ist der Großteil beider Features:

- Anlegen eines Kundenfahrzeugs
- Die Zweiteilung der Ansicht mit eigenen Fahrzeugen
- Das Kundenfeld am Fahrzeug samt Sichtbarkeitsregel
- Das Ankreuzfeld beim Anstoßen einer Übergabe
- Die Frage bei der Annahme
- Der Übergabe-Durchlauf mit verbleibender Werkstattrolle
- Die Löschung der Kundenangabe bei der Übergabe

Ein vollständiger Übergabe-Durchlauf in einer sich selbst zurückrollenden Transaktion war vorbereitet — vier Fälle einschließlich eines Angriffsversuchs, bei dem die Rolle verlangt wird, ohne dass sie angeboten wurde. Er wurde nicht ausgeführt, weil er Schreibzugriff auf die gemeinsame Datenbank braucht und dafür die Freigabe fehlt. Das Skript liegt bereit.

### Regressionsprüfung

Zwei vollständige Läufe der angemeldeten Testsuiten: **10 Fehlschläge im ersten, 18 im zweiten**. Dass die Zahl zwischen zwei Läufen desselben Standes wächst, ist der eigentliche Befund.

**Davon geht genau einer auf dieses Vorhaben zurück:** PROJ-37, Zeile 80 — siehe BUG-4.

#### BEFUND-T (Hoch, betrifft die Testsuite, nicht die Features)

Im ersten Lauf brach der Test `PROJ-38-bestand-auth.spec.ts:161` („kennzeichnen, pruefen, zuruecknehmen") ab, **nachdem** er das Testfahrzeug als verkauft gekennzeichnet hatte, aber **bevor** er es zurücknahm. Zurück blieb ein Bestandsvorgang in der Datenbank:

```
dealer_sales: E2E-Testfahrzeug Wegwerf, sold_on 2026-09-21, origin manual
erzeugt 2026-09-21 14:38 UTC — während des ersten Laufs
```

Die Bestandsseite blendet verkaufte Fahrzeuge aus (so gewollt, QA BUG-1 aus PROJ-38). Seither fehlt das Fahrzeug in der Liste, und **sieben** PROJ-38-Tests scheitern reproduzierbar — auch isoliert, auch nach Neustart. Im ersten Lauf war PROJ-38 noch nicht unter den Fehlschlägen; im zweiten mit sieben. Der Beweis liegt damit in der Reihenfolge.

**Die Suite kann sich daraus nicht selbst befreien:** Ausgerechnet der Test, der zurücknehmen würde, sucht das Fahrzeug zuerst in der Bestandsliste — wo es nicht mehr steht. Er scheitert an Zeile 174, bevor er aufräumen kann.

Die verbleibenden zehn Fehlschläge (PROJ-24, 26, 27, 28, 30, 31, 32, 33) benutzen dasselbe Wegwerf-Fahrzeug. Dass ein einzelner Datenrest sie miterklärt, ist die naheliegende Vermutung — **belegt ist sie nicht**, denn dafür müsste der Rest zuerst entfernt und neu gemessen werden. Das braucht Schreibzugriff auf die gemeinsame Datenbank.

**Was daraus folgt, unabhängig von diesen Features:** Ein einziger abgebrochener Test kann die halbe Regressionssuite dauerhaft unbrauchbar machen. Aufräumschritte gehören in einen Abschluss, der auch bei Abbruch läuft, und dürfen nicht voraussetzen, dass die Oberfläche noch den erwarteten Zustand zeigt.

#### Was ohne Vorbehalt grün ist

| Suite | Ergebnis |
|---|---|
| Einheitentests (`npm test`) | 813 von 813 |
| `PROJ-39-werkstattrolle.spec.ts` (neu) | 11 von 11 |
| `PROJ-37-werkstattrolle.spec.ts` | 17 von 18 — der eine ist BUG-4 |

### Nachtrag 2026-09-21: BUG-1, BUG-2 und BUG-3 behoben

Alle drei hatten dieselbe Wurzel und wurden zusammen behoben.

**Migration `20260921_bug1_selbstauskunft_speicherbar.sql`** — die Funktion `set_business_flags(p_is_workshop, p_is_dealer)`. Sie läuft mit erhöhten Rechten, setzt **ausschließlich** diese beiden Spalten der **eigenen** Zeile und gibt die gespeicherten Werte zurück. `subscriptions` bleibt für den Browser schreibgeschützt; `plan` bleibt unerreichbar.

Ein Parameter mit `NULL` bedeutet „nicht anfassen". Damit setzt jeder Schalter nur sich selbst und kann den anderen nicht zurücksetzen.

**Beide Komponenten** rufen jetzt diese Funktion auf und **prüfen den Rückgabewert**, statt auf das Ausbleiben eines Fehlers zu vertrauen. Genau diese Prüfung fehlte und hielt BUG-2 seit der Auslieferung von PROJ-38 verborgen. Die Eigenschaft `userId` entfiel an beiden Komponenten — die Funktion ermittelt den Anmeldenden selbst.

#### Nachgewiesen gegen die Produktionsdatenbank

| Probe | Ergebnis |
|---|---|
| Einschalten | `isWorkshop: true`, in der Tabelle bestätigt |
| Ausschalten | `isWorkshop: false`, in der Tabelle bestätigt |
| **Angriff:** `p_plan: "premium"` mitschicken | **HTTP 404** — diese Signatur gibt es nicht |
| **Angriff:** `plan` direkt in die Tabelle schreiben | blockiert, bleibt `free` |

Der Schutz aus PROJ-8 ist also unverändert wirksam.

#### Damit nachgeholt: die Prüfungen hinter dem Schalter

| Kriterium | Ergebnis |
|---|---|
| Schalter lässt sich einschalten und hält nach dem Neuladen | bestanden |
| Abschnitt „Meine Kundenfahrzeuge" erscheint | bestanden |
| Schaltfläche „Kundenfahrzeug anlegen" erscheint | bestanden |
| Leerzustand mit Erklärung | bestanden |
| Beide Gruppen stehen getrennt nebeneinander | bestanden |
| Karte „Anstehende Arbeiten" bleibt erhalten | bestanden |
| Kopfzeile zählt die Gruppen | bestanden |
| Bedienbar bei 375 px, kein waagerechter Überlauf | bestanden |
| Einheitentests nach der Behebung | 813 von 813 |
| Produktionsbau, Lint | ohne Befund |

Der Abnahmelauf lief unter einer vorübergehenden Spezifikation, die anschließend entfernt wurde: Sie verändert kontoweiten Zustand und gehört deshalb nicht in die dauerhafte Regressionssuite. Der Schalter des Testkontos wurde nachweislich zurückgesetzt.

#### Was weiterhin offen ist

- **BUG-4** (Mittel): Die geänderte Kopfzeile bricht `PROJ-37-werkstattrolle.spec.ts:80`
- **BUG-5** (Mittel): Der Abschnitt „Offene Übergaben" aus PROJ-40 ist nicht gebaut
- **BEFUND-T** (Hoch, Testsuite): Der Datenrest aus dem abgebrochenen PROJ-38-Test blockiert weiterhin sieben Tests
- **PROJ-40 ist unverändert ungeprüft.** Der Übergabe-Durchlauf braucht Schreibzugriff auf die gemeinsame Datenbank; das Skript mit vier Fällen einschließlich Angriffsversuch liegt bereit.

### Nachtrag 2026-09-21 (2): Der Übergabe-Durchlauf ist gefahren

Vier vollständige Durchläufe, jeder in einem Block, der sich am Ende selbst zurückrollt — das Fahrzeug wechselte also nie wirklich den Besitzer. Damit ist der Pfad geprüft, der bei PROJ-38 als Lücke offenblieb.

| Fall | Erwartet | Ergebnis |
|---|---|---|
| Angeboten **und** zugestimmt | Rolle `werkstatt` | **`werkstatt`**, Kundenangabe gelöscht, Nachweis gesetzt |
| Angeboten, aber abgelehnt | keine Rolle | **keine**, kein Nachweis |
| **Angriff:** nicht angeboten, Rolle dennoch verlangt | keine Rolle | **keine** — die doppelte Prüfung hält |
| **Regression:** klassisch mit Betrachter | `betrachter` wie bisher | **`betrachter`** |

Kontrolle danach: null Kundenangaben, null Übergaben mit Angebot, Fahrzeug unverändert beim Verkäufer. Nichts blieb zurück.

**Damit ist der Kern von PROJ-40 belegt:** Die verbleibende Werkstattrolle entsteht ausschließlich aus Angebot **und** Zustimmung, die Kundenangabe verschwindet bei der Übergabe, der Nachweis wird geführt, und die klassische Übergabe verhält sich unverändert.

### BEFUND-T aufgelöst

Der Datenrest wurde über die Oberfläche zurückgenommen — denselben Weg, den ein Händler nähme. Danach: **von sieben PROJ-38-Fehlschlägen blieben zwei.** Fünf gingen allein auf den Datenrest zurück.

Die verbleibenden zwei sind ebenfalls Datenlage, nicht Code: Am Testfahrzeug fehlt der Kaufpreis (`vehicle_purchases` ist leer), weshalb „Der Einkaufspreis stammt aus dem Kaufpreisfeld" und der Aufräumtest scheitern.

### BUG-6 (Kritisch, Produktion) — Keine Fahrzeugübergabe lässt sich mehr anlegen

**Gefunden** beim Nachgehen eines PROJ-33-Fehlschlags. **Betrifft nicht dieses Vorhaben**, sondern PROJ-38 — und über dieses PROJ-7, seit der Auslieferung am 2026-09-21.

Das Übergabeformular legt die Zeile so an:

```
.insert({ … }).select("id").single()
```

Das `RETURNING` verlangt Leserecht, und dafür werden die Leseregeln von `vehicle_transfers` ausgewertet. Eine davon stammt aus PROJ-7:

```
"Invited user can view transfer": to_email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())
```

Die Rolle `authenticated` hat auf `auth.users` **kein Leserecht** — in Supabase grundsätzlich nicht. Jeder Lesezugriff auf `vehicle_transfers` scheitert deshalb:

```
42501 — permission denied for table users
```

**Nachgewiesen** mit einem echten Nutzerzugang:

| Aufruf | Ergebnis |
|---|---|
| `vehicle_transfers` lesen | **403** `permission denied for table users` |
| `INSERT` **mit** `RETURNING` (so macht es das Formular) | **403** |
| `INSERT` **ohne** `RETURNING` | **201**, funktioniert |

**Warum es bis gestern lief:** Das `.select("id")` kam erst mit PROJ-38 hinzu (Commit `eaa3683`) — gebraucht für die Zuordnung des Händler-Erlöses. Vorher legte das Formular ohne `RETURNING` an. Die kaputte Leseregel existiert seit April, fiel aber nie auf, weil die Anwendung zum Lesen eine Funktion mit erhöhten Rechten benutzt (`get_vehicle_transfers`), die die Regeln umgeht.

**Warum es der Abnahme von PROJ-38 entging:** Der Test legt eine Übergabe nur an, wenn noch keine offen ist. Bei jedem Lauf lag eine aus einem früheren Lauf bereit — der anlegende Zweig lief nie.

**Zur Behebung:** Das `RETURNING` entfernen und die Kennung anders beschaffen, oder die Leseregel so umbauen, dass sie `auth.email()` statt eines Zugriffs auf `auth.users` verwendet. Die zweite Variante repariert zugleich die seit April kaputte Regel.

### Stand der Befunde

| Befund | Stufe | Stand |
|---|---|---|
| BUG-1 Selbstauskunft nicht speicherbar | Kritisch | **behoben** |
| BUG-2 derselbe Fehler bei PROJ-38 | Kritisch | **behoben** |
| BUG-3 falsche Erfolgsmeldung | Hoch | **behoben** |
| BUG-4 Kopfzeile bricht PROJ-37-Test | Mittel | offen |
| BUG-5 „Offene Übergaben" nicht gebaut | Mittel | offen |
| BUG-6 keine Übergabe anlegbar (PROJ-38/PROJ-7) | Kritisch | **behoben** |
| BEFUND-T Datenrest blockiert Tests | Hoch | **aufgelöst** |

### Nachtrag 2026-09-21 (3): BUG-6 behoben

**Migration `20260921_bug6_transfer_leseregel.sql`** — die Leseregel aus PROJ-7 verwendet jetzt `auth.email()` statt eines Zugriffs auf `auth.users`:

```
lower(to_email) = lower(auth.email())
```

`auth.email()` liest die Adresse aus dem Sitzungstoken; es braucht keine Sonderrechte. Verglichen wird in Kleinschreibung, weil die Anwendung `to_email` klein ablegt, die Adresse im Token aber so steht, wie sie registriert wurde — ohne diese Angleichung sähe ein Empfänger mit Großbuchstaben seine eigene Übergabe nicht.

Damit ist nicht nur das Anlegen repariert, sondern auch die **seit April kaputte Regel** selbst.

#### Nachgewiesen gegen die Produktionsdatenbank

| Aufruf | Vorher | Nachher |
|---|---|---|
| `vehicle_transfers` lesen | 403 `permission denied for table users` | **200** |
| `INSERT` mit `RETURNING` (so macht es das Formular) | 403 | **201** |
| **Sicherheit:** fremdes Konto liest Übergaben | — | **leeres Ergebnis** |

Die Probezeilen wurden entfernt.

#### Testergebnis nach der Behebung

| Suite | Vorher | Nachher |
|---|---|---|
| `PROJ-33-verkaufspreis-auth.spec.ts` | Vorbereitung scheitert, 10 laufen nicht | **alle grün** |
| `PROJ-32-kostendaten-transfer-auth.spec.ts` | grün | **grün** |
| Beide zusammen | — | **21 von 21** |

#### Was daraus zu lernen ist

Drei der hier gefundenen kritischen Fehler stammen aus PROJ-38, und alle drei blieben aus demselben Grund verborgen: **Ein Test, der eine Vorbedingung nur herstellt, wenn sie fehlt, prüft den Herstellungsweg nie.** Sowohl der PROJ-33-Test (legt eine Übergabe nur an, wenn keine offen ist) als auch die Abnahme des Händlerschalters (Merkmal per SQL gesetzt statt über die Oberfläche) umgingen genau den Pfad, der kaputt war.

### Abschließende Regressionsprüfung

Vollständiger Lauf der angemeldeten Suiten: **12 Fehlschläge**. Jeder einzelne wurde nachverfolgt.

| Ursache | Anzahl | Beleg |
|---|---|---|
| Datenlage (BEFUND-T) | 7 | Nach Bereinigung: `PROJ-38-bestand-auth.spec.ts` **12 von 12 grün** |
| Zeitverhalten unter Last | 4 | Dieselben Tests einzeln ausgeführt: **5 von 5 grün** |
| **Echt (BUG-4)** | **1** | `PROJ-37-werkstattrolle.spec.ts:80` — die geänderte Kopfzeile |

**Von zwölf Fehlschlägen geht genau einer auf dieses Vorhaben zurück.**

Die vier zeitbedingten (PROJ-30 zweimal, PROJ-31, PROJ-32) sind alle Tests, die über drei Bildschirmbreiten navigieren. Sie scheitern nur im parallelen Gesamtlauf, nie einzeln — dasselbe Verhalten, das schon die Abnahme von PROJ-38 als BEFUND-A beschrieb: Der Entwicklungsserver übersetzt Seiten beim ersten Aufruf und braucht unter Last länger als die Wartezeit der Tests.

#### BEFUND-T ist ein Kreislauf, kein Einzelfall

Der Datenrest entstand im selben Lauf **erneut**: Der Test kennzeichnet das Fahrzeug als verkauft und scheitert danach, bevor er zurücknimmt — woraufhin alle folgenden Läufe scheitern. Nach Bereinigung der Daten lief dieselbe Suite vollständig durch, Aufräumschritt eingeschlossen.

**Das ist unabhängig von diesen Features zu beheben.** Solange der Aufräumschritt voraussetzt, dass die Oberfläche den erwarteten Zustand zeigt, macht ein einziger Abbruch die Suite dauerhaft unbrauchbar.

### Urteil

| Feature | Stand | Begründung |
|---|---|---|
| **PROJ-39** | **Approved** | Alle Akzeptanzkriterien geprüft, keine Befunde der Stufen Kritisch oder Hoch offen |
| **PROJ-40** | **In Review** | Der Abschnitt „Offene Übergaben" ist nicht gebaut (BUG-5) — ein vollständiger Block der Akzeptanzkriterien |

PROJ-40 bleibt bewusst in Prüfung, obwohl kein Befund der Stufen Kritisch oder Hoch offen ist: Ein Feature, dessen Kriterien zu einem Viertel unerfüllt sind, ist nicht abgenommen, sondern unfertig. Sein Kern — die verbleibende Werkstattrolle — ist dagegen geprüft und belegt.

## Deployment

- **Produktions-URL:** https://www.oldtimer-docs.com
- **Ausgeliefert:** 2026-09-21
- **Deployment:** `8d7b8b1` (production, READY)
- **Git-Tag:** `v1.39.0-PROJ-39`

### Vor der Auslieferung geprüft

| Prüfung | Ergebnis |
|---|---|
| Produktionsbau | erfolgreich |
| Lint | keine Fehler |
| Einheitentests | 813 von 813 |
| Abnahme | Approved, keine Befunde der Stufen Kritisch oder Hoch |
| Migrationen eingespielt | ja, im Systemkatalog nachgeprüft |
| Geheimnisse im Repository | keine; `.env.local` ist ignoriert |
| Umgebungsvariablen in Vercel | alle gesetzt |

### Nach der Auslieferung geprüft

Gegen die **ausgelieferte** Anwendung, nicht gegen den Entwicklungsserver
(`npx playwright test --config playwright.prod.config.ts`): **10 von 10 grün**,
darunter vier neue für dieses Feature.

| Prüfung | Ergebnis |
|---|---|
| `/werkstatt`, `/bestand`, `/settings` unangemeldet | Weiterleitung zur Anmeldung |
| Ausgeliefertes Dokument enthält Kundendaten | nein — weder Namen noch Feldbezeichner |
| Selbstauskunft setzen und zurücknehmen | funktioniert |
| Übergaben lesbar | HTTP 200 |

Die dritte Zeile ist die wichtigste: Die Kundenangaben einer Werkstatt sind
Namen und Rufnummern von Leuten, die die Plattform nicht einmal kennen. Sie
stehen in keinem unangemeldeten Dokument.

### Der Rollout lief diesmal sofort an

Nach dem Cron-Fix vom Vortag (siehe Nachtrag in PROJ-35) nimmt Vercel
Deployments wieder an: vom Push bis `READY` ohne Eingriff. Zum Vergleich —
PROJ-37 und PROJ-38 warteten zwei Wochen auf eine Auslieferung, die nie
stattfand.

### Mit ausgeliefert, aber nicht abgenommen

Der Code von **PROJ-40** liegt in denselben Commits und ist damit live. Das
Feature steht trotzdem auf **In Review**: Der Abschnitt „Offene Übergaben"
ist nicht gebaut. Sein Kern — die verbleibende Werkstattrolle — ist geprüft
und durch den Übergabe-Durchlauf belegt; ausgeliefert im Sinne der
Abnahme ist er deshalb noch nicht.

Praktisch ist das unschädlich: Ohne den fehlenden Abschnitt fehlt der
Werkstatt nur die Anzeige, welche Übergaben offen sind. Anstoßen, annehmen
und die Rolle behalten funktionieren.

### Ebenfalls enthalten: zwei Fehlerbehebungen an ausgeliefertem Code

- `3c5bdf9` — die Selbstauskünfte ließen sich nicht speichern; der
  Händlerschalter aus PROJ-38 funktioniert damit erstmals
- `e4b4f46` — die Leseregel aus PROJ-7 blockierte seit dem Vortag **jede**
  Fahrzeugübergabe

Beide sind in Produktion nachgeprüft.

### Umgebungsvariablen

Alle für dieses Feature nötigen Werte sind gesetzt. Zwei Lücken betreffen es
nicht, bleiben aber vermerkt:

- `ANTHROPIC_API_KEY` fehlt — betrifft allein den Scheckheft-Import (PROJ-35)
- `E2E_VEHICLE_ID` fehlt — eine Testvariable, gehört nicht nach Vercel
