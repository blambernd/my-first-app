# PROJ-20: Mobile Responsive Optimierung

## Status: In Progress
**Created:** 2026-04-09
**Last Updated:** 2026-04-09

## Dependencies
- None (verbessert bestehende Features PROJ-1 bis PROJ-19)

## User Stories
- As a Smartphone-Nutzer, I want to alle Seiten bequem auf meinem Handy bedienen so that ich mein Fahrzeug auch unterwegs verwalten kann
- As a Nutzer auf einem kleinen Bildschirm, I want to eine mobile Navigation nutzen so that ich schnell zwischen Bereichen wechseln kann
- As a Nutzer, I want to Touch-optimierte Bedienelemente haben so that ich Buttons und Links ohne Probleme treffen kann
- As a Nutzer, I want to Formulare mobil komfortabel ausfüllen so that ich Fahrzeugdaten und Scheckheft-Einträge auch vom Handy anlegen kann
- As a Nutzer, I want to Tabellen und Übersichten mobil lesbar sehen so that ich keine horizontale Scrollleiste brauche

## Acceptance Criteria
- [ ] Alle Seiten sind auf 375px Breite (iPhone SE) ohne horizontales Scrollen nutzbar
- [ ] Navigation ist auf Mobile als Hamburger-Menü oder Bottom-Navigation umgesetzt
- [ ] Alle interaktiven Elemente haben mindestens 44x44px Touch-Targets
- [ ] Formulare nutzen die vollen Bildschirmbreite und passende Input-Typen (date, email, tel)
- [ ] Tabellen (Scheckheft, Dokumente, Ersatzteile) sind auf Mobile als Karten oder gestapelte Ansicht dargestellt
- [ ] Modals und Dialoge sind auf Mobile fullscreen oder als Bottom-Sheet dargestellt
- [ ] Bildergalerien sind per Touch/Swipe bedienbar (bereits teilweise umgesetzt)
- [ ] Fahrzeug-Dashboard ist auf Mobile übersichtlich und scrollbar
- [ ] Landing Page ist vollständig responsive
- [ ] Login/Registrierung ist auf Mobile komfortabel nutzbar
- [ ] Alle Seiten haben korrekte Viewport-Meta-Tags
- [ ] Font-Größen sind auf Mobile lesbar (min. 16px für Body-Text)

## Edge Cases
- Was passiert bei sehr langen Fahrzeugnamen oder Titeln? Truncation mit Ellipsis
- Wie verhalten sich Dropdown-Menüs auf Mobile? Native Select oder angepasstes Dropdown
- Wie funktioniert die Datepicker-Komponente auf Mobile? Native date input als Fallback
- Was passiert bei Landscape-Orientierung? Layout passt sich an, keine Breakpoints brechen
- Wie verhält sich die App bei 320px Breite (ältere Geräte)? Grundlegende Nutzbarkeit sichergestellt

## Technical Requirements
- Breakpoints: 375px (Mobile), 768px (Tablet), 1024px+ (Desktop)
- Alle bestehenden Tailwind-Responsive-Klassen prüfen und ergänzen
- Touch-Events für Swipe-Gesten wo sinnvoll (Galerie, Timeline)
- Keine neuen Dependencies — nur CSS/Tailwind-Anpassungen
- Performance: Lazy Loading für Bilder auf Mobile beibehalten

## Betroffene Seiten (Audit)
- [ ] Landing Page (`/`)
- [ ] Login / Registrierung (`/login`, `/registrieren`)
- [ ] Dashboard / Fahrzeugübersicht (`/vehicles`)
- [ ] Fahrzeugdetail (`/vehicles/[id]`)
- [ ] Fahrzeug bearbeiten (`/vehicles/[id]/edit`)
- [ ] Scheckheft (`/vehicles/[id]/scheckheft`)
- [ ] Dokumente (`/vehicles/[id]/dokumente`)
- [ ] Historie / Timeline (`/vehicles/[id]/historie`)
- [ ] Ersatzteile (`/vehicles/[id]/ersatzteile`)
- [ ] Verkaufsinserat (`/vehicles/[id]/inserat`)
- [ ] Verkaufsassistent (`/vehicles/[id]/verkaufsassistent`)
- [ ] Öffentliches Profil (`/profil/[token]`)
- [ ] FAQ (`/faq`)
- [ ] Kontakt (`/kontakt`)
- [ ] Veranstaltungen (`/veranstaltungen`)
- [ ] Einstellungen / Profil

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)

### Überblick
Reine Frontend-Optimierung — kein Backend-Aufwand nötig. Alle bestehenden Seiten werden für mobile Geräte (ab 375px) optimiert. Die Navigation wird für Mobile auf eine Bottom Tab Bar umgestellt.

### Betroffene Bereiche

#### 1. Mobile Navigation — Bottom Tab Bar
```
Aktuelle Desktop-Navigation:
+--------------------------------------------------+
|  Logo    [Notifications]  [User-Dropdown ▾]      |
+--------------------------------------------------+

Neue Mobile-Navigation (< 768px):
+------------------------------+
|  Logo              [Bell]    |
+------------------------------+
|                              |
|       Seiteninhalt           |
|                              |
+------------------------------+
| Dashboard | Fzg | Bell | Me |  <-- Bottom Tab Bar (fest)
+------------------------------+
```
- **Bottom Tab Bar** mit 4 Tabs: Dashboard, Fahrzeug (aktives), Benachrichtigungen, Profil/Menü
- Nur auf Mobile sichtbar (< 768px), Desktop behält aktuelle Header-Navigation
- Nutzt shadcn/ui Sheet-Komponente (bereits vorhanden) für "Mehr"-Menü
- AccountHeader wird auf Mobile vereinfacht (kein Dropdown, nur Logo + Bell)

#### 2. Fahrzeug-Unternavigation
```
Aktuell (horizontal scrollbar):
[Übersicht] [Scheckheft] [Historie] [Dokumente] [Verkaufsassistent]

Neu auf Mobile:
+------------------------------+
| Übersicht | Scheckheft | ... |  <-- scrollbar, größere Touch-Targets
+------------------------------+
```
- VehicleProfileNav bekommt größere Touch-Targets (min. 44px Höhe)
- Horizontales Scrollen bleibt, aber mit sichtbarem Scroll-Indikator
- Aktiver Tab scrollt automatisch in den sichtbaren Bereich

#### 3. Formulare
```
Aktuell (Desktop-Grid):
[Marke          ] [Modell         ]
[Baujahr        ] [Erstzulassung  ]

Neu auf Mobile:
[Marke                         ]
[Modell                        ]
[Baujahr                       ]
[Erstzulassung                 ]
```
- Grid-Layouts werden auf Mobile einspaltiges Stack-Layout
- Input-Felder nutzen volle Breite
- Native Input-Typen: `type="date"`, `type="email"`, `type="tel"`
- Submit-Buttons volle Breite auf Mobile

#### 4. Tabellen → Karten-Ansicht
```
Aktuell (Desktop-Tabelle):
| Datum      | Werkstatt  | Beschreibung        | Kosten |
| 12.03.2026 | Müller AG  | Ölwechsel + Filter  | 450€   |

Neu auf Mobile (Karte):
+------------------------------+
| 12.03.2026            450€   |
| Ölwechsel + Filter           |
| Müller AG                    |
+------------------------------+
```
- Scheckheft-Einträge, Ersatzteile, Mitglieder-Liste als gestapelte Karten
- Wichtigste Info (Datum, Titel) oben, Details darunter

#### 5. Dialoge & Modals
- Auf Mobile: Modals werden fullscreen dargestellt (shadcn Sheet mit `side="bottom"`)
- AlertDialogs bleiben zentriert, aber mit angepasster Breite
- Formulare in Dialogen bekommen vertikales Layout

#### 6. Bildergalerien
- Swipe-Navigation bereits implementiert (PROJ-4, PROJ-5) — ggf. Touch-Targets prüfen
- Thumbnails: 2 Spalten statt 3-4 auf Mobile

#### 7. Landing Page
- Hero-Section: Text-Stack statt Side-by-Side
- Feature-Cards: 1 Spalte statt Grid
- CTA-Buttons volle Breite

### Datenmodell
Kein neues Datenmodell — reine UI-Anpassungen.

### Technische Entscheidungen

| Entscheidung | Gewählt | Warum |
|---|---|---|
| Navigation | Bottom Tab Bar | Standard bei mobilen Apps, mit dem Daumen erreichbar, schneller Wechsel zwischen Hauptbereichen |
| Tabellen auf Mobile | Karten-Layout | Kein horizontales Scrollen nötig, Info-Hierarchie klar erkennbar |
| Dialoge auf Mobile | Bottom Sheet / Fullscreen | Nutzt den vollen Bildschirm, einfacher zu bedienen als zentrierte Modals |
| Breakpoint-Strategie | Mobile-First Anpassungen | Tailwind `sm:` und `md:` Prefixes ergänzen, bestehende Desktop-Styles bleiben |
| Neue Dependencies | Keine | Alles mit Tailwind CSS und vorhandenen shadcn/ui Komponenten umsetzbar |

### Dependencies
Keine neuen Packages — vorhandene shadcn/ui Komponenten reichen aus:
- `Sheet` (sidebar/bottom sheet) — bereits installiert
- `Tabs` — bereits installiert
- `Card` — bereits installiert

### Implementierungs-Reihenfolge
1. **Mobile Bottom Tab Bar** — neue Komponente, eingebunden im Root-Layout
2. **AccountHeader** — Mobile-Variante (kompakter)
3. **VehicleProfileNav** — Touch-Targets vergrößern
4. **Formulare** — Grid → Stack auf Mobile
5. **Tabellen** — Karten-Ansicht auf Mobile
6. **Dialoge** — Fullscreen/Bottom-Sheet auf Mobile
7. **Landing Page** — responsive Anpassungen
8. **Audit aller Seiten** — Feinschliff, Edge Cases

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
