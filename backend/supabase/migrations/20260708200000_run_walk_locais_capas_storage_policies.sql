-- Bucket e políticas de storage para capas de locais para correr

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'run-walk-locais-capas',
  'run-walk-locais-capas',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "service_role_run_walk_locais_capas_all" ON storage.objects;

CREATE POLICY "service_role_run_walk_locais_capas_all"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'run-walk-locais-capas')
  WITH CHECK (bucket_id = 'run-walk-locais-capas');
