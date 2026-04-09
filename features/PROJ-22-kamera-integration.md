# PROJ-22: Kamera-Integration

## Status: Planned
**Created:** 2026-04-09
**Last Updated:** 2026-04-09

## Dependencies
- Requires: PROJ-21 (Capacitor App Setup) — native Kamera-API benötigt Capacitor-Hülle
- Relates to: PROJ-4 (Dokumenten-Archiv) — Dokumente per Kamera hochladen
- Relates to: PROJ-2 (Fahrzeugprofil) — Fahrzeugfotos per Kamera aufnehmen
- Relates to: PROJ-5 (Fahrzeug-Timeline) — Timeline-Bilder per Kamera aufnehmen

## User Stories
- As a Nutzer, I want to Dokumente (Rechnungen, Gutachten, TÜV-Berichte) direkt abfotografieren so that ich sie ohne Umweg über die Galerie ins Archiv laden kann
- As a Nutzer, I want to Fahrzeugfotos direkt mit der Kamera aufnehmen so that ich mein Fahrzeugprofil schnell mit aktuellen Bildern füllen kann
- As a Nutzer, I want to beim Erstellen eines Timeline-Eintrags Fotos aufnehmen so that ich Restaurierungen und Reparaturen direkt dokumentieren kann
- As a Nutzer, I want to zwischen Kamera und Galerie wählen können so that ich flexibel bin ob ich ein neues Foto mache oder ein bestehendes nutze
- As a Nutzer, I want to aufgenommene Fotos vor dem Upload in einer Vorschau sehen so that ich unscharfe oder falsche Bilder verwerfen kann

## Acceptance Criteria
- [ ] Kamera-Button ist in der Dokumenten-Upload-UI verfügbar (neben Datei-Auswahl)
- [ ] Kamera-Button ist beim Fahrzeugprofil-Bilder-Upload verfügbar
- [ ] Kamera-Button ist beim Timeline-Eintrag-Bilder-Upload verfügbar
- [ ] Nutzer kann zwischen "Foto aufnehmen" und "Aus Galerie wählen" wählen
- [ ] Aufgenommene Fotos werden in einer Vorschau angezeigt vor dem Upload
- [ ] Bilder werden vor dem Upload auf eine sinnvolle Größe komprimiert (max. 2MB)
- [ ] Kamera-Berechtigung wird beim ersten Zugriff angefragt mit erklärendem Text
- [ ] Wenn Berechtigung verweigert wird, erscheint ein Hinweis mit Link zu den Einstellungen
- [ ] Im Web-Browser (ohne Capacitor) fällt die Funktion auf den normalen File-Input zurück
- [ ] Aufgenommene Dokument-Fotos können optional zugeschnitten werden (Crop)

## Edge Cases
- Was passiert wenn der Nutzer die Kamera-Berechtigung verweigert? Fallback auf Galerie-Auswahl + Hinweis
- Was passiert bei sehr großen Fotos (> 10MB)? Automatische Komprimierung vor Upload
- Was passiert wenn die Kamera nicht verfügbar ist (z.B. Desktop)? Kamera-Button wird ausgeblendet
- Was passiert bei schlechtem Licht / unscharfen Fotos? Vorschau mit Möglichkeit zum erneuten Aufnehmen
- Was passiert wenn der Upload während der Aufnahme abbricht? Foto wird lokal zwischengespeichert, Retry möglich

## Technical Requirements
- @capacitor/camera Plugin für nativen Kamera-Zugriff
- Bild-Komprimierung clientseitig (Canvas API oder Library)
- Capacitor-Feature-Detection: `Capacitor.isNativePlatform()` für bedingte UI
- Fallback auf `<input type="file" accept="image/*" capture="environment">` im Web
- EXIF-Daten beibehalten für Datum, GPS optional strippen für Privacy

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
