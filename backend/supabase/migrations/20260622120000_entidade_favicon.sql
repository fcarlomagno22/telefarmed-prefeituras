-- Favicon personalizado do portal de gestão e UBT da entidade.

ALTER TABLE entidades_contratantes
  ADD COLUMN IF NOT EXISTS favicon_storage_path TEXT;

CREATE INDEX IF NOT EXISTS entidades_contratantes_favicon_storage_path_idx
  ON entidades_contratantes (favicon_storage_path)
  WHERE favicon_storage_path IS NOT NULL;
