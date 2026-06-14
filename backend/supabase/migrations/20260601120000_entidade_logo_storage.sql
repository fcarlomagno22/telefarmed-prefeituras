-- Logo quadrado das entidades contratantes (admin clientes)

ALTER TABLE entidades_contratantes
  ADD COLUMN IF NOT EXISTS logo_storage_path TEXT;

CREATE INDEX IF NOT EXISTS entidades_contratantes_logo_storage_path_idx
  ON entidades_contratantes (logo_storage_path)
  WHERE logo_storage_path IS NOT NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'entidades-logos',
  'entidades-logos',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
