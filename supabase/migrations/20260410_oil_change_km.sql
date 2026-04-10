-- Migrate oil_change_categories from next_due_date (string) to next_due_km (number)
-- This updates existing service entries that have oil_change_categories with next_due_date
-- to use next_due_km instead. Since the old values were dates (not km), we set next_due_km to null.

UPDATE service_entries
SET oil_change_categories = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'category', elem->>'category',
      'next_due_km', null,
      'custom_label', elem->>'custom_label'
    )
  )
  FROM jsonb_array_elements(oil_change_categories::jsonb) AS elem
)
WHERE oil_change_categories IS NOT NULL
  AND oil_change_categories::text LIKE '%next_due_date%';
