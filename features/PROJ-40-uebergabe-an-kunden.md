# PROJ-40: Fahrzeug-Übergabe an den Kunden

## Status: In Review
**Created:** 2026-09-21
**Last Updated:** 2026-09-21

## Dependencies
- Requires: PROJ-7 (Fahrzeug-Transfer) — dieses Feature erweitert die bestehende Übergabe, es ersetzt sie nicht
- Requires: PROJ-39 (Werkstatt-Konto & Kundenfahrzeuge) — liefert die Fahrzeuge, die übergeben werden
- Requires: PROJ-6 (Rollen & Kollaboration) — die Werkstattrolle, die nach der Übergabe bestehen bleiben soll
- Requires: PROJ-1 (User Authentication) — der Kunde registriert sich im Zuge der Annahme
- Berührt: PROJ-32 (Kostendaten beim Transfer) — deren Regeln gelten unverändert weiter
- Nutzt: PROJ-38 (Händler-Bestandsübersicht) — der Händler nutzt denselben Weg; die Erweiterung steht auch ihm offen

## Kontext
Der Fahrzeug-Transfer aus PROJ-7 kann bereits alles, was für die Übergabe an einen Kunden nötig ist — einschließlich des Falls, dass der Empfänger noch kein Konto hat: Er erhält eine E-Mail mit Registrierungslink, die Übergabe wird nach der Registrierung aktiv. Der Händler nutzt das seit PROJ-38 im Alltag.

Für die Werkstatt hat der Ablauf jedoch einen Haken, der das ganze Modell entwertet: **Nach PROJ-7 verliert der bisherige Besitzer seine Rolle und kann nur noch Betrachter bleiben.** Eine Werkstatt, die ein Fahrzeug übergibt, verliert damit im selben Moment das Recht, die nächste Inspektion einzutragen. Die Übergabe bestraft genau das Verhalten, das gewünscht ist.

Dieses Feature schließt die Lücke: Der bisherige Besitzer kann nach der Übergabe als **Werkstatt** verbunden bleiben — wenn der neue Besitzer dem bei der Annahme zustimmt.

## Leitgedanke (verbindlich)
Der neue Besitzer entscheidet. Die Werkstatt **schlägt vor**, weiter verbunden zu bleiben; wirksam wird das erst durch die Zustimmung des Kunden im Moment der Annahme. Eine Rolle, die stillschweigend übergeht, wäre eine Zugriffsberechtigung, der niemand zugestimmt hat — und würde dem Vertrauensmodell aus PROJ-6 widersprechen.

## User Stories
- Als Werkstatt möchte ich ein selbst angelegtes Kundenfahrzeug an meinen Kunden übergeben, damit er die dokumentierte Historie bekommt, sobald er sich registriert
- Als Werkstatt möchte ich nach der Übergabe weiter Einträge schreiben dürfen, damit die Dokumentation nicht mit dem Besitzerwechsel abreißt
- Als Kunde möchte ich bei der Annahme entscheiden, ob die Werkstatt weiter Zugriff behält, damit ich Herr meiner Daten bleibe
- Als Kunde möchte ich ein Fahrzeug mit gefüllter Historie übernehmen, statt bei null anzufangen
- Als Werkstatt möchte ich sehen, welche Übergaben noch offen sind, damit ich nachfassen kann
- Als Werkstatt möchte ich eine abgelaufene Übergabe erneut anstoßen können, ohne das Fahrzeug neu anzulegen

## Acceptance Criteria

### Übergabe anstoßen
- [ ] Die Werkstatt kann aus dem Werkstattbereich heraus eine Übergabe an eine E-Mail-Adresse starten
- [ ] Ist im Kundenfeld (PROJ-39) eine E-Mail hinterlegt, ist sie vorausgefüllt
- [ ] Beim Anstoßen kann die Werkstatt ankreuzen: "Nach der Übergabe als Werkstatt verbunden bleiben" (Standard: an)
- [ ] Der bestehende Ablauf aus PROJ-7 bleibt im Übrigen unverändert — einschließlich der Regeln aus PROJ-32 zu Kostendaten
- [ ] Hat der Empfänger noch kein Konto, gilt unverändert PROJ-7: E-Mail mit Registrierungslink, Übergabe wird nach der Registrierung aktiv

### Annahme durch den Kunden
- [ ] Hat die Werkstatt den Wunsch angekreuzt, zeigt die Annahmeseite die Frage, ob die genannte Werkstatt weiterhin Zugriff auf das Fahrzeug erhalten soll — vorausgewählt ja, abwählbar
- [ ] Der Text benennt konkret, was die Werkstattrolle darf (Scheckheft-Einträge und Dokumente hinzufügen) und was nicht (Fahrzeug ändern oder löschen, andere einladen)
- [ ] Stimmt der Kunde zu, ist der bisherige Besitzer nach der Übergabe mit der Rolle **Werkstatt** verknüpft
- [ ] Wählt der Kunde ab, verliert der bisherige Besitzer jeden Zugriff — wie bisher nach PROJ-7
- [ ] Die bestehende Wahlmöglichkeit aus PROJ-7 (als Betrachter verbunden bleiben) bleibt erhalten und schließt sich mit dieser gegenseitig aus
- [ ] Hat die Werkstatt den Wunsch nicht angekreuzt, erscheint die Frage nicht
- [ ] Der Kunde kann die Werkstatt jederzeit später unter "Mitglieder" entfernen oder herabstufen
- [ ] Der Besitzerwechsel erscheint wie bisher in der Timeline (PROJ-5)

### Offene Übergaben
- [ ] Der Werkstattbereich kennzeichnet Fahrzeuge mit laufender Übergabe sichtbar als "Übergabe offen"
- [ ] Die Kennzeichnung nennt die Empfängeradresse und das Ablaufdatum
- [ ] Läuft die Einladung ab (7 Tage, PROJ-7), bleibt das Fahrzeug unverändert Eigentum der Werkstatt und wird als "Übergabe abgelaufen" gekennzeichnet
- [ ] Die Werkstatt kann eine abgelaufene Übergabe mit einem Schritt erneut anstoßen
- [ ] Die Werkstatt kann eine laufende Übergabe abbrechen (bestehendes Verhalten aus PROJ-7)

### Kundendaten
- [ ] Das Kundenfeld aus PROJ-39 wird **nicht** mitübertragen — der neue Besitzer sieht es nicht
- [ ] Nach erfolgreicher Übergabe wird das Kundenfeld gelöscht, auch wenn die Werkstatt verbunden bleibt

## Edge Cases
- Was passiert, wenn der Kunde die Übergabe ablehnt? → Das Fahrzeug bleibt unverändert bei der Werkstatt, sie wird benachrichtigt (bestehendes Verhalten aus PROJ-7)
- Was passiert, wenn der Kunde das Fahrzeug bereits selbst angelegt hat? → Er hat es danach zweimal. Eine Zusammenführung ist in dieser Ausbaustufe nicht vorgesehen; er kann eines löschen. Der Fall ist im Annahmetext zu erwähnen, nicht technisch zu lösen
- Was passiert, wenn die Werkstatt während der laufenden Übergabe weiter Einträge schreibt? → Sie ist bis zur Annahme Besitzer und darf das; übertragen wird der Stand zum Zeitpunkt der Annahme (bestehendes Verhalten aus PROJ-7)
- Was passiert, wenn der Kunde die Werkstatt direkt nach der Annahme entfernt? → Zulässig und folgenlos für die Historie. Die von der Werkstatt geschriebenen Einträge bleiben erhalten, sie kann nur keine neuen mehr anlegen
- Was passiert, wenn die Werkstatt ihr Konto löscht, während Übergaben offen sind? → Die Übergaben verfallen mit dem Fahrzeug. Vor dem Löschen ist darauf hinzuweisen
- Was passiert, wenn der bisherige Besitzer gar keine Werkstatt ist (privater Verkauf, Händler)? → Die Frage erscheint nur, wenn beim Anstoßen angekreuzt. Der Weg steht jedem offen; vorausgewählt ist der Wunsch aber nur bei Konten mit Werkstatt-Deklaration
- Was passiert bei einer Kette: Werkstatt übergibt an Kunde, Kunde verkauft weiter? → Beim zweiten Transfer gelten dieselben Regeln. Die Werkstatt bleibt nach PROJ-7 als bestehende Kollaboration erhalten; der neue Besitzer kann sie entfernen

## Offene Punkte für die Architektur
- **Verhältnis zu PROJ-7:** Zu klären ist, ob die Erweiterung in `accept_vehicle_transfer` eingreift oder daneben liegt. Diese Funktion trägt bereits die Ergänzungen aus PROJ-32 und PROJ-38 — sie ist der empfindlichste Punkt der Umsetzung
- **Nachweisbarkeit:** Die Zustimmung des Kunden sollte festgehalten werden, nicht nur in ihrer Wirkung. Sie ist die Rechtsgrundlage dafür, dass ein Dritter Zugriff auf seine Fahrzeugdaten behält

## Technical Requirements
- Security: Die verbleibende Werkstattrolle entsteht ausschließlich durch die Zustimmung bei der Annahme, niemals durch eine Angabe der Werkstatt allein
- Security: Nach der Übergabe darf der bisherige Besitzer keine Rechte behalten, die über die Werkstattrolle aus PROJ-6 hinausgehen
- Die bestehende Übergabe ohne Werkstattbezug muss unverändert funktionieren (Regressionsgefahr für PROJ-7, PROJ-32, PROJ-33 und PROJ-38)

## Implementation Notes (Backend)

**Stand:** 2026-09-21 — Migration eingespielt und geprüft.

### Migration `20260921_proj40_uebergabe_werkstattrolle.sql`
- `vehicle_transfers.offer_workshop_role` — der Wunsch der Werkstatt
- `vehicle_transfers.workshop_role_granted_at` — der Nachweis der Zustimmung
- `accept_vehicle_transfer` um den Parameter `p_grant_workshop` erweitert
- `get_transfer_by_token` liefert zusätzlich `offerWorkshopRole` und die Adresse des Absenders

### Der geänderte Abschnitt
Wie im Entwurf vorgesehen wurde **ein** Abschnitt angefasst — der, der den alten Besitzer als Betrachter einträgt. Statt fest `'betrachter'` steht dort jetzt:

1. Werkstattrolle, wenn die Werkstatt sie angeboten **und** der Kunde zugestimmt hat
2. sonst Betrachter, wenn `keep_as_viewer` gesetzt ist — das bisherige Verhalten
3. sonst gar nichts

Jede Übergabe ohne Werkstattbezug durchläuft damit denselben Weg wie vorher.

### Die doppelte Prüfung ist der eigentliche Schutz
`p_grant_workshop` kommt aus dem Browser und ist dort veränderbar. Allein würde es genügen, einem beliebigen Vorbesitzer Schreibrechte zu verschaffen. Erst die zusätzliche Bedingung `offer_workshop_role` — eine Angabe, die nur der Absender beim Anstoßen setzen kann — macht daraus eine belastbare Regel.

### Beim Bauen fast falsch gemacht
`get_transfer_by_token` wurde zunächst aus dem Gedächtnis neu geschrieben. Die Fassung hätte die Statuslogik (invalid / accepted / declined / expired) verloren und damit die Annahmeseite lahmgelegt. Aufgefallen beim Abgleich mit PROJ-7, behoben durch wörtliche Übernahme. Wer diese Funktion künftig anfasst: Die Statusabfragen vor dem Rückgabewert sind kein Beiwerk.

### Code-Anbindung
- `src/lib/validations/transfer.ts` — `offerWorkshopRole` im Schema
- `src/lib/validations/sale-report.ts` — `grant_workshop_role` als freiwillige Angabe bei der Annahme
- `src/components/transfer-form.tsx` — Ankreuzfeld, schließt sich mit der Betrachter-Wahl gegenseitig aus
- `src/app/transfer/[token]/page.tsx` — die Frage bei der Annahme, vorausgewählt ja
- `src/app/api/transfers/[token]/accept/route.ts` — reicht die Entscheidung weiter
- `src/app/vehicles/[id]/transfer/page.tsx` + `client.tsx` — Werkstatt-Angabe durchgereicht

### Ein Befund aus dem Test
Die Annahme-Route weist einen falsch getypten Wert mit **400** ab, statt ihn still zu verwerfen — strenger, als der Kommentar über der Route vermuten lässt, und für dieses Feature die richtige Antwort: Lieber eine sichtbare Ablehnung als eine unterstellte Zustimmung zu einer dauerhaften Zugriffsberechtigung. Zwei Tests halten das fest.

### Noch nicht gebaut
Die Kennzeichnung offener und abgelaufener Übergaben im Werkstattbereich (Abschnitt „Offene Übergaben" der Akzeptanzkriterien) fehlt noch. Sie hängt an keiner Datenbankänderung und lässt sich nachziehen.

### Beinahe die gesamte Übergabe lahmgelegt

Die erste Fassung dieser Migration hätte **jede Fahrzeugübergabe unbrauchbar gemacht**. Der Fehler fiel erst beim Nachprüfen auf, bevor irgendetwas eingespielt war.

`CREATE OR REPLACE FUNCTION` ersetzt eine Funktion nur, solange die Signatur gleich bleibt. Der zusätzliche Parameter `p_grant_workshop` macht daraus eine **zweite** Funktion neben der alten. Beide nehmen einen Aufruf mit sechs Argumenten an — der siebte hat ja einen Vorgabewert —, und Postgres lehnt einen solchen Aufruf dann ab:

```
function accept_vehicle_transfer(...) is not unique
```

Behoben durch ein ausdrückliches `DROP FUNCTION` der alten Signatur vor dem `CREATE`. Dieselbe Stelle haben PROJ-33 und PROJ-36 vor uns getroffen; beide lösen es genauso. **Wer diese Funktion um einen Parameter erweitert, muss die alte Signatur zuerst entfernen.**

### Eingespielt am 2026-09-21
Angewendet über die Management-Schnittstelle, danach im Systemkatalog nachgeprüft:

| Prüfung | Ergebnis |
|---|---|
| Fassungen von `accept_vehicle_transfer` | **genau eine** — keine Mehrdeutigkeit |
| Signatur | sieben Parameter, `p_grant_workshop` zuletzt |
| Aufruf **ohne** den neuen Parameter | funktioniert unverändert |
| Aufruf **mit** dem neuen Parameter | funktioniert |
| `vehicle_transfers`: beide neuen Spalten | vorhanden |
| `get_transfer_by_token`: Statuslogik | erhalten (`invalid` bei unbekanntem Schlüssel) |
| `search_path` beider Funktionen | fest auf `public` |

Dass **beide** Aufrufvarianten funktionieren, ist der Beleg dafür, dass keine Überladung stehen geblieben ist.

### Die früheren Schritte sind alle noch drin
Im Quelltext der eingespielten Funktion nachgewiesen:

| Feature | Merkmal | Vorhanden |
|---|---|---|
| PROJ-32 | `costs_cleared_at` | ja |
| PROJ-33 | `vehicle_sales` | ja |
| PROJ-36 | Währungsübernahme | ja |
| PROJ-38 | `dealer_sales` | ja |
| PROJ-5 | Timeline-Eintrag | ja |
| PROJ-39 | Löschen der Kundenangabe | ja |
| PROJ-40 | verbleibende Rolle | ja |

Das ersetzt keinen echten Übergabe-Durchlauf — der bleibt für die Abnahme offen, weil er nicht umkehrbar ist.

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

**Erstellt:** 2026-09-21

### Ein Befund vorweg: Heute entscheidet der Falsche

Die bestehende Übergabe kennt bereits die Frage, ob der alte Besitzer verbunden bleibt — aber sie stellt sie der falschen Person. Beim Anstoßen kreuzt der **Absender** an „als Betrachter verbunden bleiben" (vorbelegt mit ja); der Empfänger sieht diese Angabe auf der Annahmeseite nur noch als Mitteilung. Er kann sie nicht ändern.

Diese Spezifikation verlangt das Gegenteil: Der Kunde entscheidet. Der Entwurf verschiebt die Entscheidung deshalb vom Anstoßen zur Annahme. Das ist die eigentliche Arbeit an diesem Feature — nicht die neue Rolle.

Für die bestehende Betrachter-Wahl bleibt das Verhalten unverändert, damit private Verkäufe sich weiter so verhalten wie bisher.

### Aufbau der Oberfläche

```
Übergabe anstoßen (bestehendes Formular, erweitert)
+-- E-Mail des Empfängers (vorausgefüllt aus der Kundenangabe)
+-- bestehende Wahl "als Betrachter verbunden bleiben"
+-- neue Wahl "als Werkstatt verbunden bleiben" (nur für Werkstatt-Konten,
|   vorbelegt mit ja; schließt die Betrachter-Wahl aus)
+-- Bestätigungsdialog (bestehend, Text ergänzt)

Annahmeseite (bestehende Seite, erweitert)
+-- Fahrzeugdaten (bestehend)
+-- neue Frage: "[Werkstatt] weiterhin Zugriff geben?"
|   +-- vorausgewählt ja, abwählbar
|   +-- Aufzählung, was die Rolle darf und was nicht
|   +-- erscheint nur, wenn die Werkstatt es angeboten hat
+-- Annahme-Schaltfläche (bestehend)

Werkstatt-Bereich (Seite aus PROJ-39, erweitert)
+-- Abschnitt "Meine Kundenfahrzeuge"
    +-- Kennzeichnung "Übergabe offen" mit Adresse und Ablaufdatum
    +-- Kennzeichnung "Übergabe abgelaufen" mit Schaltfläche "Erneut senden"
```

### Welche Informationen gespeichert werden

**An der Übergabe** kommt eine zweite Ja/Nein-Angabe hinzu — der **Wunsch** der Werkstatt, als Werkstatt verbunden zu bleiben. Sie steht neben der vorhandenen Betrachter-Angabe.

**Bei der Annahme** wird die **Entscheidung des Kunden** mitgegeben. Sie wird nicht aus der Übergabe gelesen, sondern von der Annahmeseite gesendet. Genau darin liegt die Verschiebung: Der Wunsch der Werkstatt steuert nur, ob die Frage überhaupt erscheint.

**Festgehalten** wird außerdem, dass der Kunde zugestimmt hat, mit Zeitpunkt. Nicht für die Anwendung — sie braucht nur das Ergebnis —, sondern als Nachweis. Diese Zustimmung ist die Rechtsgrundlage dafür, dass ein fremder Betrieb dauerhaft Zugriff auf die Fahrzeugdaten eines Privatmanns behält. Wer sie nur in ihrer Wirkung speichert, kann später nicht belegen, dass sie erteilt wurde.

### Technische Entscheidungen und ihre Begründung

**1. Die Übergabefunktion wird an genau einer Stelle geändert.**
In der Funktion, die eine Übergabe vollzieht, gibt es einen einzigen Abschnitt, der den alten Besitzer als Betrachter einträgt. Dort — und nur dort — wird künftig stattdessen die Rolle gesetzt, die der Kunde gewählt hat.

Das ist wichtiger, als es klingt. Diese Funktion ist der empfindlichste Baustein des Projekts: Acht Änderungen aus fünf Features haben sie bereits angefasst, zuletzt vorgestern. Sie entfernt Kostendaten, legt Bestandsvorgänge an, überträgt Währungen und schreibt die Timeline. Ein Eingriff an falscher Stelle gefährdet vier ausgelieferte Features auf einmal. Der Entwurf beschränkt sich deshalb bewusst auf diesen einen Abschnitt und rührt die Reihenfolge der übrigen Schritte nicht an.

**2. Die neue Angabe bekommt eine Vorbelegung, damit ältere Aufrufe weiterlaufen.**
Datenbank und Anwendung werden nicht im selben Moment ausgeliefert. Für einige Minuten ruft die alte Anwendung die neue Funktion auf, ohne die neue Angabe zu kennen. Mit einer Vorbelegung („keine Werkstattrolle") verhält sie sich in diesem Fenster exakt wie bisher, statt Übergaben scheitern zu lassen.

**3. Die Kennzeichnung offener Übergaben nutzt die vorhandene Abfrage.**
Welche Übergaben zu einem Fahrzeug laufen, lässt sich bereits abfragen — es gibt dafür eine Funktion aus PROJ-7. Die Werkstattansicht fragt sie für ihre eigenen Fahrzeuge mit ab. Kein neuer Speicher, keine zweite Wahrheit über den Zustand einer Übergabe.

**4. „Erneut senden" legt eine neue Übergabe an, statt die alte wiederzubeleben.**
Eine abgelaufene Übergabe bleibt abgelaufen. Das erhält die Nachvollziehbarkeit — man sieht, dass ein erster Versuch verstrichen ist — und vermeidet die Frage, ob ein alter Link plötzlich wieder gültig wird. Er wird es nicht.

**5. Die Kundenangaben werden beim Vollzug entfernt.**
An derselben Stelle, an der heute schon die Kostendaten des Vorbesitzers gelöscht werden. Das ist keine zusätzliche Mechanik, sondern eine Zeile mehr in einem bereits vorhandenen Abschnitt.

### Zusätzliche Pakete
Keine.

### Reihenfolge der Umsetzung
1. Backend: zusätzliche Angabe an der Übergabe, Erweiterung der Übergabefunktion, Nachweis der Zustimmung
2. Frontend: Ankreuzfeld beim Anstoßen
3. Frontend: Frage auf der Annahmeseite
4. Frontend: Kennzeichnung offener und abgelaufener Übergaben

Schritt 1 ist Voraussetzung für 2 und 3. Schritt 4 ist unabhängig.

### Was beim Testen besonders zu prüfen ist
Nicht das neue Verhalten ist das Risiko, sondern das alte. Nach der Änderung muss weiterhin gelten:
- Eine Übergabe zwischen zwei Privatleuten verhält sich unverändert (PROJ-7)
- Kostendaten des Vorbesitzers verschwinden weiterhin vollständig (PROJ-32)
- Der Bestandsvorgang des Händlers entsteht weiterhin und mit denselben Beträgen (PROJ-38)
- Die anonyme Verkaufserhebung bleibt unberührt (PROJ-33)
- Die Währungsübernahme funktioniert weiterhin (PROJ-36)

Diese fünf Punkte gehören in die Abnahme, auch wenn keiner von ihnen zu diesem Feature gehört.

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
_To be added by /deploy_
