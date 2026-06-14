-- Documentos clínicos emitidos: verificação pública, atestados estruturados.

ALTER TABLE consulta_anexos
  ADD COLUMN IF NOT EXISTS codigo_verificacao TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS consulta_anexos_codigo_verificacao_uidx
  ON consulta_anexos (codigo_verificacao)
  WHERE char_length(trim(codigo_verificacao)) > 0;

CREATE TABLE IF NOT EXISTS consulta_atestados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id UUID NOT NULL REFERENCES consultas(id) ON DELETE CASCADE,
  dias_afastamento INTEGER NOT NULL,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  cid TEXT NOT NULL DEFAULT '',
  motivo TEXT NOT NULL DEFAULT '',
  observacoes TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consulta_atestados_dias_validos CHECK (dias_afastamento BETWEEN 1 AND 365),
  CONSTRAINT consulta_atestados_motivo_nao_vazio CHECK (char_length(trim(motivo)) > 0)
);

CREATE INDEX IF NOT EXISTS consulta_atestados_consulta_idx
  ON consulta_atestados (consulta_id, criado_em DESC);

ALTER TABLE consulta_atestados ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE consulta_atestados FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE consulta_atestados TO service_role;
