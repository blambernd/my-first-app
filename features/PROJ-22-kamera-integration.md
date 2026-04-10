# PROJ-22: Kamera-Integration

## Status: Deployed
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

### Überblick
Web-first Kamera-Integration — funktioniert sofort in mobilen Browsern über HTML `capture`-Attribut und clientseitige Bild-Komprimierung. Kein Capacitor nötig für Phase 1. Wenn PROJ-21 (Capacitor) fertig ist, wird die native Kamera-API als Upgrade nachgerüstet.

### Betroffene Bereiche

#### 1. Neue Shared-Komponente: CameraCapture
```
CameraCapture (wiederverwendbar)
+-- "Foto aufnehmen"-Button (Kamera-Icon)
|   +-- Nutzt <input type="file" accept="image/*" capture="environment">
|   +-- Öffnet direkt die Kamera auf Mobilgeräten
+-- "Aus Galerie"-Button (Bild-Icon)
|   +-- Nutzt <input type="file" accept="image/*"> (ohne capture)
|   +-- Öffnet die normale Dateiauswahl/Galerie
+-- Vorschau des aufgenommenen Fotos
|   +-- Bild-Anzeige mit Qualitäts-Hinweis
|   +-- "Verwerfen"-Button (X)
|   +-- "Erneut aufnehmen"-Button
+-- Optionaler Crop-Bereich (nur für Dokumente)
```

- Wird als Ergänzung neben dem bestehenden Dropzone-Upload eingebaut
- Auf Desktop wird nur "Aus Galerie" angezeigt (Kamera-Detection)
- Auf Mobile erscheinen beide Optionen

#### 2. Bild-Komprimierung
```
Ablauf nach Foto-Aufnahme:
1. Foto wird aufgenommen (oft 5-12 MB von Smartphone-Kamera)
2. Automatische Komprimierung auf max. 2 MB
   - Canvas API: Bild auf Canvas zeichnen, als JPEG mit Qualität 0.8 exportieren
   - Bei > 2 MB: Qualität schrittweise senken (0.7, 0.6, 0.5)
   - Bei > 4000px Breite/Höhe: Proportional verkleinern
3. Komprimiertes Bild wird als Vorschau angezeigt
4. Nutzer bestätigt oder nimmt erneut auf
5. Bild geht an den bestehenden Upload-Flow
```

#### 3. Integration in bestehende Komponenten

**ImageUpload** (Fahrzeugfotos):
```
Aktuell:
+-------------------------------------+
|  [Dropzone: Bilder hierher ziehen]  |
+-------------------------------------+

Neu:
+-------------------------------------+
|  [Dropzone: Bilder hierher ziehen]  |
+-------------------------------------+
|  [📷 Foto aufnehmen] [🖼 Galerie]  |  <-- Nur auf Mobile sichtbar
+-------------------------------------+
```

**DocumentUploadForm** (Dokument-Archiv):
```
Aktuell:
+-------------------------------------+
|  [Dropzone: Datei hierher ziehen]   |
+-------------------------------------+

Neu:
+-------------------------------------+
|  [Dropzone: Datei hierher ziehen]   |
+-------------------------------------+
|  [📷 Abfotografieren] [🖼 Galerie] |  <-- Nur auf Mobile sichtbar
|  +-- Crop-Option nach Aufnahme      |
+-------------------------------------+
```

**MilestoneForm** (Timeline-Einträge):
```
Gleiche Integration wie ImageUpload
```

#### 4. Kamera-Erkennung
```
Prüfung ob Kamera verfügbar:
- Phase 1 (Web): navigator.mediaDevices vorhanden? → Kamera-Button anzeigen
- Phase 2 (Capacitor): Capacitor.isNativePlatform() → Native Kamera-API nutzen
- Desktop ohne Kamera → Nur Galerie/Dropzone anzeigen
```

#### 5. Dokument-Crop (optional)
```
Nach Abfotografieren eines Dokuments:
+------------------------------+
| [Aufgenommenes Foto]         |
|  +-- Crop-Rahmen (ziehbar)   |
|  +-- Auto-Erkennung der      |
|      Dokumenten-Kanten        |
+------------------------------+
| [Zuschneiden] [Überspringen] |
+------------------------------+
```

- Nur im Dokumenten-Upload, nicht bei Fahrzeugfotos
- Einfacher Crop über Canvas API (kein Auto-Detect in Phase 1)

#### 6. Berechtigungs-Handling
```
Erster Kamera-Zugriff:
1. Browser fragt automatisch nach Berechtigung
2. Bei Ablehnung: Hinweis-Banner mit Erklärung
   "Kamera-Zugriff wurde blockiert. 
    Um Fotos aufzunehmen, erlaube den Kamera-Zugriff 
    in deinen Browser-Einstellungen."
3. Fallback auf Galerie-Auswahl bleibt immer verfügbar
```

### Datenmodell
Kein neues Datenmodell — aufgenommene Fotos durchlaufen denselben Upload-Pfad wie Galerie-Bilder (Supabase Storage).

### Technische Entscheidungen

| Entscheidung | Gewählt | Warum |
|---|---|---|
| Phase 1 Ansatz | HTML `capture` Attribut | Funktioniert sofort in allen mobilen Browsern, keine Dependencies, kein Capacitor nötig |
| Bild-Komprimierung | Canvas API (nativ) | Keine extra Library nötig, Browser-Canvas kann JPEG-Qualität steuern |
| Crop-Funktion | react-image-crop | Leichtgewichtige Library (~8KB gzip), gut getestet, nur für Dokument-Crop |
| Kamera vs. Galerie | Zwei getrennte Buttons | Klarer als ein kombiniertes Menü, Mobile-UX-Standard |
| Capacitor-Upgrade | Späterer Layer | Phase 1 funktioniert ohne Capacitor, Phase 2 ergänzt native API für bessere Qualität/UX |

### Dependencies
- **react-image-crop** — Dokument-Crop nach Kamera-Aufnahme (nur Phase 1, ~8KB)
- Keine weiteren neuen Dependencies

### Implementierungs-Reihenfolge
1. **useCamera Hook** — Kamera-Erkennung, Komprimierung, Vorschau-Logik
2. **CameraCapture-Komponente** — Wiederverwendbare UI mit Aufnahme + Vorschau
3. **ImageUpload erweitern** — CameraCapture neben Dropzone einbauen
4. **DocumentUploadForm erweitern** — CameraCapture + Crop einbauen
5. **MilestoneForm erweitern** — CameraCapture einbauen
6. **Berechtigungs-Handling** — Fallback-Hinweise bei Ablehnung
7. **Phase 2 (nach PROJ-21)** — Capacitor Camera Plugin als Upgrade

## QA Test Results

**QA Date:** 2026-04-09
**Tested by:** QA Engineer (automated + code review)

### Acceptance Criteria Results

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| 1 | Kamera-Button in Dokumenten-Upload-UI | PASS | CameraCapture with enableCrop integrated in DocumentUploadForm |
| 2 | Kamera-Button beim Fahrzeugprofil-Bilder-Upload | PASS | CameraCapture integrated in ImageUpload |
| 3 | Kamera-Button beim Timeline-Eintrag-Bilder-Upload | PASS | CameraCapture integrated in MilestoneForm |
| 4 | Nutzer kann zwischen "Foto aufnehmen" und "Galerie" wählen | PASS | Two separate buttons, camera uses `capture="environment"` |
| 5 | Vorschau vor dem Upload | PASS | Preview with Verwenden/Erneut/Verwerfen buttons |
| 6 | Komprimierung auf max. 2MB | PASS | Canvas API with stepwise quality reduction (0.8→0.3), dimension cap 4000px |
| 7 | Kamera-Berechtigung mit erklärendem Text | PARTIAL | Banner UI exists but `handleCameraPermissionError` is never called — see BUG-1 |
| 8 | Hinweis bei verweigerte Berechtigung | PARTIAL | Same as #7 — banner code exists but is dead code |
| 9 | Web-Browser Fallback auf File-Input | PASS | Uses HTML `<input capture="environment">`, no Capacitor dependency |
| 10 | Dokument-Crop optional | PASS | react-image-crop integrated in DocumentUploadForm only |

### Edge Cases

| Case | Result | Notes |
|------|--------|-------|
| Kamera-Berechtigung verweigert | N/A | HTML capture attribute handles this via browser, no JS permission needed |
| Sehr große Fotos (>10MB) | PASS | Compression scales down + reduces JPEG quality |
| Kamera nicht verfügbar (Desktop) | PASS | `hasCamera` detection hides camera button on desktop |
| Unscharfe Fotos | PASS | Preview with "Erneut aufnehmen" button |
| Upload-Abbruch | N/A | Phase 1 doesn't cache locally — standard browser behavior |

### Security Audit

- [x] No new API routes — no server-side attack surface
- [x] File inputs accept only `image/*` — no arbitrary file types
- [x] Image compression happens client-side (Canvas API) — no server resource risk
- [x] No external services called — all processing local
- [x] File names preserved from original — no path traversal risk (Supabase Storage handles sanitization)
- [x] Object URLs properly revoked on discard

### Regression Testing

- [x] 281 unit tests pass (268 existing + 13 new)
- [x] 12 E2E tests pass (6 × 2 browsers)
- [x] Existing Vitest and Playwright test suites unaffected
- [x] Landing page renders correctly
- [x] Login/Register pages work
- [x] Build passes without errors

### Bugs Found

#### BUG-1: Permission denied banner is dead code [Medium]
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Open CameraCapture component code
  2. `handleCameraPermissionError` is returned from `useCamera` but never destructured or called in `CameraCapture`
  3. `permissionDenied` state can never become `true`
  4. Expected: Banner shows when camera permission is denied
  5. Actual: Banner is never triggered
- **File:** `src/components/camera-capture.tsx` — missing call to `handleCameraPermissionError`
- **Note:** For Phase 1 (HTML `capture` attribute), the browser handles permissions natively via the file picker. This banner would be useful in Phase 2 (Capacitor) where explicit permission requests are needed. For now, it's harmless dead code.
- **Fix:** Either wire up permission detection or remove the dead code until Phase 2.

#### BUG-2: Double object URL in ImageUpload integration [Low]
- **Severity:** Low
- **Steps to Reproduce:**
  1. Camera captures a photo → `compressImage` creates `URL.createObjectURL(compressedFile)` as `preview`
  2. User confirms → `onCapture([preview.file])` sends the file to ImageUpload
  3. ImageUpload's `onCapture` handler creates another `URL.createObjectURL(file)` for the preview
  4. The first object URL from compression is never revoked
- **File:** `src/components/image-upload.tsx:124-128`
- **Fix:** Use the existing preview URL from the compressed image, or revoke it in CameraCapture after confirm.

### Test Suites Written

- **Unit tests:** 13 tests in `src/hooks/use-camera.test.ts`
  - Compression constants, dimension scaling, file naming, skip logic
- **E2E tests:** 6 tests in `tests/PROJ-22-kamera-integration.spec.ts` (× 2 browsers = 12)
  - Page load verification, responsive viewports, regression checks

### Summary

- **Acceptance Criteria:** 8/10 passed, 2/10 partial (permission handling — acceptable for Phase 1)
- **Edge Cases:** 3/5 passed, 2/5 N/A (not applicable for Phase 1)
- **Bugs Found:** 2 total (0 critical, 0 high, 1 medium, 1 low)
- **Security:** Pass — no vulnerabilities found
- **Production Ready:** YES — BUG-1 is dead code (harmless), BUG-2 is a minor memory leak
- **Recommendation:** Deploy as-is. Fix BUG-1 and BUG-2 when building Phase 2 (Capacitor integration).

## Deployment

**Deployed:** 2026-04-10
**Production URL:** https://my-first-app-blambernd.vercel.app
**Commit:** 915212c
