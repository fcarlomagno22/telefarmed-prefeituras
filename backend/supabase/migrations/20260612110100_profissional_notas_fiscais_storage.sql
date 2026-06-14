-- Storage privado para notas fiscais enviadas no fechamento do profissional.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profissional-notas-fiscais',
  'profissional-notas-fiscais',
  false,
  8388608,
  ARRAY[
    'application/pdf',
    'text/xml',
    'application/xml'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;
