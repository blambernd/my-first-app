-- PROJ-35: Scheckheft-Import aus Dokumenten — Datenbankschema
-- Im Supabase SQL Editor ausführen (Dashboard > SQL Editor > New query)

-- ============================================================
-- 1. BESCHREIBUNG WIRD OPTIONAL (Änderung an PROJ-3)
-- ============================================================
-- Ein Papier-Scheckheft-Raster enthält keinen Fließtext. Das Modell darf die
-- Beschreibung nicht erfinden, also muss das Feld leer bleiben dürfen.
-- Betrifft auch das bestehende manuelle Formular.
ALTER TABLE service_entries ALTER COLUMN description DROP NOT NULL;

-- ============================================================
-- 2. BELEG-ZUORDNUNG: EIN DOKUMENT AUF VIELE EINTRÄGE
-- ============================================================
-- Bisher zeigte vehicle_documents.service_entry_id auf HÖCHSTENS EINEN Eintrag.
-- Eine Scheckheftseite erzeugt aber viele Einträge. Diese Zuordnungstabelle
-- dreht die Beziehung um; das alte Feld bleibt vorerst bestehen, damit nichts
-- bricht, und wird unten einmalig übernommen.
CREATE TABLE service_entry_documents (
  service_entry_id UUID NOT NULL REFERENCES service_entries(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES vehicle_documents(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (service_entry_id, document_id)
);

-- Bestehende Zuordnungen übernehmen, damit nichts verloren geht
INSERT INTO service_entry_documents (service_entry_id, document_id, vehicle_id)
SELECT d.service_entry_id, d.id, d.vehicle_id
  FROM vehicle_documents d
 WHERE d.service_entry_id IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE INDEX idx_sed_entry ON service_entry_documents(service_entry_id);
CREATE INDEX idx_sed_document ON service_entry_documents(document_id);

ALTER TABLE service_entry_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or member can view entry documents"
  ON service_entry_documents FOR SELECT
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) IS NOT NULL);

CREATE POLICY "Owner or werkstatt can link entry documents"
  ON service_entry_documents FOR INSERT
  WITH CHECK (get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt'));

CREATE POLICY "Owner or werkstatt can unlink entry documents"
  ON service_entry_documents FOR DELETE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt'));

-- ============================================================
-- 3. IMPORT-AUFTRÄGE
-- ============================================================
CREATE TABLE scheckheft_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'ready', 'completed', 'failed')),
  page_count INTEGER NOT NULL CHECK (page_count > 0 AND page_count <= 50),
  -- Verständlicher Grund für den Nutzer, kein technischer Fehlertext
  error_reason TEXT CHECK (error_reason IS NULL OR length(error_reason) <= 500),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Offenen Auftrag je Fahrzeug finden
CREATE INDEX idx_import_jobs_vehicle_status
  ON scheckheft_import_jobs(vehicle_id, status, created_at DESC);

-- Kontingent je Konto: Seiten eines Nutzers im Zeitfenster zählen
CREATE INDEX idx_import_jobs_user_created
  ON scheckheft_import_jobs(created_by, created_at DESC);

-- Auffangnetz: hängengebliebene Aufträge finden
CREATE INDEX idx_import_jobs_stale
  ON scheckheft_import_jobs(status, started_at)
  WHERE status IN ('queued', 'running');

ALTER TABLE scheckheft_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or member can view import jobs"
  ON scheckheft_import_jobs FOR SELECT
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) IS NOT NULL);

CREATE POLICY "Owner or werkstatt can create import jobs"
  ON scheckheft_import_jobs FOR INSERT
  WITH CHECK (
    get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt')
    AND created_by = auth.uid()
  );

CREATE POLICY "Owner or werkstatt can update import jobs"
  ON scheckheft_import_jobs FOR UPDATE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt'))
  WITH CHECK (get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt'));

CREATE POLICY "Only owner can delete import jobs"
  ON scheckheft_import_jobs FOR DELETE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

CREATE TRIGGER scheckheft_import_jobs_updated_at
  BEFORE UPDATE ON scheckheft_import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. SEITEN EINES AUFTRAGS
-- ============================================================
-- Die hochgeladene Seite liegt als ganz normales Dokument im Archiv. Diese
-- Tabelle hält nur fest, welche Seite zu welchem Auftrag gehört und welche
-- Seitennummer sie im Assistenten trägt.
CREATE TABLE scheckheft_import_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES scheckheft_import_jobs(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES vehicle_documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL CHECK (page_number > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, page_number)
);

CREATE INDEX idx_import_documents_job ON scheckheft_import_documents(job_id);
-- Kontingent je Fahrzeug: ausgewertete Seiten zählen
CREATE INDEX idx_import_documents_vehicle ON scheckheft_import_documents(vehicle_id);

ALTER TABLE scheckheft_import_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or member can view import documents"
  ON scheckheft_import_documents FOR SELECT
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) IS NOT NULL);

CREATE POLICY "Owner or werkstatt can create import documents"
  ON scheckheft_import_documents FOR INSERT
  WITH CHECK (get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt'));

CREATE POLICY "Only owner can delete import documents"
  ON scheckheft_import_documents FOR DELETE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) = 'besitzer');

-- ============================================================
-- 5. ERKANNTE, NOCH NICHT BESTÄTIGTE EINTRÄGE
-- ============================================================
-- WICHTIG: Entwürfe sind KEINE Scheckheft-Einträge.
--
-- Sie liegen bewusst in einer eigenen Tabelle und nicht als Kennzeichen an
-- service_entries. Damit ist ausgeschlossen, dass ein unbestätigter
-- Maschinen-Eintrag in der Historie, in einer Auswertung (PROJ-27, PROJ-28),
-- im Export oder beim Fahrzeug-Transfer auftaucht — auch dann nicht, wenn
-- irgendwo ein Filter vergessen wird. Die Trennung ist die technische
-- Absicherung des Versprechens "nie ohne Bestätigung", nicht bloß eine
-- Eigenschaft der Oberfläche.
CREATE TABLE scheckheft_import_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES scheckheft_import_jobs(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  -- Alle Felder sind hier NULL-fähig: Was nicht im Dokument steht, bleibt leer.
  -- Die Pflichtfeld-Prüfung greift erst bei der Übernahme.
  service_date DATE,
  entry_type TEXT CHECK (
    entry_type IS NULL OR
    entry_type IN ('inspection', 'oil_change', 'repair', 'tuv_hu', 'restoration', 'other')
  ),
  description TEXT CHECK (description IS NULL OR length(description) <= 2000),
  mileage_km INTEGER CHECK (mileage_km IS NULL OR (mileage_km >= 0 AND mileage_km <= 9999999)),
  workshop_name TEXT CHECK (workshop_name IS NULL OR length(workshop_name) <= 200),
  cost_cents INTEGER CHECK (cost_cents IS NULL OR cost_cents >= 0),
  next_due_date DATE,
  -- Herkunft je Feld: extracted | empty | edited
  field_origins JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_page INTEGER CHECK (source_page IS NULL OR source_page > 0),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'confirmed', 'discarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_import_drafts_job ON scheckheft_import_drafts(job_id, service_date);

ALTER TABLE scheckheft_import_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or member can view import drafts"
  ON scheckheft_import_drafts FOR SELECT
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) IS NOT NULL);

CREATE POLICY "Owner or werkstatt can create import drafts"
  ON scheckheft_import_drafts FOR INSERT
  WITH CHECK (get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt'));

CREATE POLICY "Owner or werkstatt can update import drafts"
  ON scheckheft_import_drafts FOR UPDATE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt'))
  WITH CHECK (get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt'));

CREATE POLICY "Owner or werkstatt can delete import drafts"
  ON scheckheft_import_drafts FOR DELETE
  USING (get_user_vehicle_role(vehicle_id, auth.uid()) IN ('besitzer', 'werkstatt'));

CREATE TRIGGER scheckheft_import_drafts_updated_at
  BEFORE UPDATE ON scheckheft_import_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. BENACHRICHTIGUNG "SEITEN AUSGEWERTET"
-- ============================================================
-- Die Meldung läuft bewusst über die Anzeige im Produkt und nicht nur über
-- Push: Push funktioniert in der Capacitor-App derzeit nicht (siehe PROJ-36).
-- Wer sich darauf verliesse, baute eine Benachrichtigung, die App-Nutzer nie
-- erreicht.
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('part_alert_match', 'service_reminder', 'scheckheft_import_ready'));

-- ============================================================
-- KONTROLLE
-- ============================================================
-- Erwartet: 4 neue Tabellen mit aktivem RLS, description ist NULL-fähig
--   SELECT column_name, is_nullable FROM information_schema.columns
--    WHERE table_name = 'service_entries' AND column_name = 'description';
--   SELECT relname, relrowsecurity FROM pg_class
--    WHERE relname IN ('service_entry_documents', 'scheckheft_import_jobs',
--                      'scheckheft_import_documents', 'scheckheft_import_drafts');
--   SELECT tablename, count(*) FROM pg_policies
--    WHERE tablename LIKE 'scheckheft_import%' OR tablename = 'service_entry_documents'
--    GROUP BY tablename;
