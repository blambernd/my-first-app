-- PROJ-4: Dokumenten-Archiv — Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- ============================================================
-- 1. VEHICLE_DOCUMENTS TABLE
-- ============================================================
CREATE TABLE vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) <= 200),
  category TEXT NOT NULL CHECK (category IN ('rechnung', 'gutachten', 'tuev_bericht', 'kaufvertrag', 'versicherung', 'zulassung', 'sonstiges')),
  document_date DATE NOT NULL,
  description TEXT CHECK (description IS NULL OR length(description) <= 1000),
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type TEXT NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  service_entry_id UUID REFERENCES service_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vehicle_documents_vehicle_id ON vehicle_documents(vehicle_id);
CREATE INDEX idx_vehicle_documents_date ON vehicle_documents(vehicle_id, document_date DESC);
CREATE INDEX idx_vehicle_documents_category ON vehicle_documents(vehicle_id, category);
CREATE INDEX idx_vehicle_documents_service_entry ON vehicle_documents(service_entry_id);

-- RLS
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents of own vehicles"
  ON vehicle_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_documents.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents for own vehicles"
  ON vehicle_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_documents.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents of own vehicles"
  ON vehicle_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_documents.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents of own vehicles"
  ON vehicle_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_documents.vehicle_id
      AND vehicles.user_id = auth.uid()
    )
  );

-- Reuse the existing updated_at trigger function from PROJ-2
CREATE TRIGGER vehicle_documents_updated_at
  BEFORE UPDATE ON vehicle_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 2. STORAGE BUCKET: vehicle-documents
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-documents',
  'vehicle-documents',
  TRUE,
  10485760, -- 10 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);

-- Storage Policies: Users can manage files in their own folder (user_id/vehicle_id/*)

CREATE POLICY "Users can upload vehicle documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vehicle-documents'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Anyone can view vehicle documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle-documents');

CREATE POLICY "Users can update own vehicle documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'vehicle-documents'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Users can delete own vehicle documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vehicle-documents'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
