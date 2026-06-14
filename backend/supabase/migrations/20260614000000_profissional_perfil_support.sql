-- Suporte ao módulo profissional/perfil: índices e bucket de certificados A1

CREATE INDEX IF NOT EXISTS candidaturas_profissionais_profissional_id_idx
  ON candidaturas_profissionais (profissional_id)
  WHERE profissional_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS candidatura_documentos_candidatura_status_idx
  ON candidatura_documentos (candidatura_id, status);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profissionais-certificados',
  'profissionais-certificados',
  false,
  5242880,
  ARRAY[
    'application/x-pkcs12',
    'application/pkcs12',
    'application/octet-stream'
  ]::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMENT ON COLUMN usuarios_profissionais.assinatura IS
  'JSON certificado ICP-Brasil: modo (conselho_nuvem|a1_arquivo|nao_cadastrado), status, updatedAt, expiresAt, emissorDescricao, arquivoNome, titularNome, storagePath (A1).';
