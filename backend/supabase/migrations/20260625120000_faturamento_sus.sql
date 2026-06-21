-- Fechamento SUS municipal: workflow de pendências, lotes e histórico.

CREATE TABLE IF NOT EXISTS faturamento_pendencia_estado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_sus_id UUID NOT NULL REFERENCES consultas_registro_sus(id) ON DELETE CASCADE,
  consulta_id UUID NOT NULL REFERENCES consultas(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aberta',
  responsible_name TEXT,
  ignore_justification TEXT,
  corrected_at TIMESTAMPTZ,
  clinical_request_sent_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT faturamento_pendencia_estado_kind CHECK (char_length(trim(kind)) > 0),
  CONSTRAINT faturamento_pendencia_estado_status CHECK (
    status IN (
      'aberta',
      'em_correcao',
      'aguardando_profissional',
      'corrigida',
      'validada',
      'ignorada',
      'nao_faturavel'
    )
  ),
  CONSTRAINT faturamento_pendencia_estado_unico UNIQUE (registro_sus_id, kind)
);

CREATE INDEX IF NOT EXISTS faturamento_pendencia_estado_entidade_idx
  ON faturamento_pendencia_estado (entidade_contratante_id, status);

CREATE INDEX IF NOT EXISTS faturamento_pendencia_estado_consulta_idx
  ON faturamento_pendencia_estado (consulta_id);

DROP TRIGGER IF EXISTS faturamento_pendencia_estado_atualizado_em ON faturamento_pendencia_estado;
CREATE TRIGGER faturamento_pendencia_estado_atualizado_em
  BEFORE UPDATE ON faturamento_pendencia_estado
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE IF NOT EXISTS faturamento_fechamentos (
  id TEXT PRIMARY KEY,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  competencia CHAR(7) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('principal', 'complementar')),
  complemento_seq INT,
  status TEXT NOT NULL DEFAULT 'em_preparacao',
  closed_at TIMESTAMPTZ,
  closed_by TEXT,
  fechamento_id TEXT,
  lote_id TEXT,
  exported_at TIMESTAMPTZ,
  last_revalidation_at TIMESTAMPTZ,
  consultas_no_lote INT,
  bloqueantes_registrados INT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT faturamento_fechamentos_competencia_format CHECK (competencia ~ '^\d{4}-\d{2}$'),
  CONSTRAINT faturamento_fechamentos_status CHECK (
    status IN ('em_preparacao', 'pronto_para_fechar', 'fechado', 'exportado')
  ),
  CONSTRAINT faturamento_fechamentos_complemento_seq CHECK (
    (tipo = 'principal' AND complemento_seq IS NULL)
    OR (tipo = 'complementar' AND complemento_seq IS NOT NULL AND complemento_seq > 0)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS faturamento_fechamentos_principal_uidx
  ON faturamento_fechamentos (entidade_contratante_id, competencia)
  WHERE tipo = 'principal';

CREATE UNIQUE INDEX IF NOT EXISTS faturamento_fechamentos_complemento_uidx
  ON faturamento_fechamentos (entidade_contratante_id, competencia, complemento_seq)
  WHERE tipo = 'complementar';

CREATE INDEX IF NOT EXISTS faturamento_fechamentos_entidade_competencia_idx
  ON faturamento_fechamentos (entidade_contratante_id, competencia DESC);

DROP TRIGGER IF EXISTS faturamento_fechamentos_atualizado_em ON faturamento_fechamentos;
CREATE TRIGGER faturamento_fechamentos_atualizado_em
  BEFORE UPDATE ON faturamento_fechamentos
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE IF NOT EXISTS faturamento_fechamento_consultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fechamento_record_id TEXT NOT NULL REFERENCES faturamento_fechamentos(id) ON DELETE CASCADE,
  registro_sus_id UUID NOT NULL REFERENCES consultas_registro_sus(id) ON DELETE RESTRICT,
  consulta_id UUID NOT NULL REFERENCES consultas(id) ON DELETE RESTRICT,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  excluded BOOLEAN NOT NULL DEFAULT false,
  exclude_reason TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT faturamento_fechamento_consultas_unico UNIQUE (fechamento_record_id, registro_sus_id)
);

CREATE INDEX IF NOT EXISTS faturamento_fechamento_consultas_fechamento_idx
  ON faturamento_fechamento_consultas (fechamento_record_id);

CREATE TABLE IF NOT EXISTS faturamento_lote_exclusoes (
  registro_sus_id UUID NOT NULL REFERENCES consultas_registro_sus(id) ON DELETE CASCADE,
  fechamento_record_id TEXT NOT NULL REFERENCES faturamento_fechamentos(id) ON DELETE CASCADE,
  exclude_reason TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (registro_sus_id, fechamento_record_id)
);

COMMENT ON TABLE faturamento_pendencia_estado IS
  'Estado operacional das pendências SUS (correção, ignore, validação).';
COMMENT ON TABLE faturamento_fechamentos IS
  'Registros de fechamento principal e complementar por competência municipal.';
COMMENT ON TABLE faturamento_fechamento_consultas IS
  'Consultas incluídas em um fechamento SUS fechado/exportado.';
COMMENT ON TABLE faturamento_lote_exclusoes IS
  'Consultas excluídas manualmente do lote antes do fechamento.';

REVOKE ALL ON faturamento_pendencia_estado FROM anon, authenticated;
REVOKE ALL ON faturamento_fechamentos FROM anon, authenticated;
REVOKE ALL ON faturamento_fechamento_consultas FROM anon, authenticated;
REVOKE ALL ON faturamento_lote_exclusoes FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON faturamento_pendencia_estado TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON faturamento_fechamentos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON faturamento_fechamento_consultas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON faturamento_lote_exclusoes TO service_role;
