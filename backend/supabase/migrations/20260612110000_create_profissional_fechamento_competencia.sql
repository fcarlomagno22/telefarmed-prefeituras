-- Fechamento mensal do profissional (NF + PIX) vinculado ao repasse.

CREATE TYPE profissional_fechamento_status AS ENUM (
  'aberto',
  'em_analise',
  'aprovado',
  'rejeitado',
  'pago'
);

CREATE TABLE profissional_fechamento_competencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES usuarios_profissionais(id) ON DELETE CASCADE,
  repasse_id UUID REFERENCES profissional_repasse_competencia(id) ON DELETE SET NULL,
  competencia TEXT NOT NULL,
  status profissional_fechamento_status NOT NULL DEFAULT 'aberto',
  invoice_file_name TEXT NOT NULL DEFAULT '',
  invoice_storage_path TEXT NOT NULL DEFAULT '',
  invoice_mime_type TEXT NOT NULL DEFAULT '',
  pix_tipo TEXT NOT NULL DEFAULT '',
  pix_chave TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  rejection_reason TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profissional_fechamento_competencia_unico UNIQUE (profissional_id, competencia),
  CONSTRAINT profissional_fechamento_competencia_formato CHECK (
    competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
  )
);

CREATE INDEX profissional_fechamento_profissional_idx
  ON profissional_fechamento_competencia (profissional_id, competencia DESC);

CREATE INDEX profissional_fechamento_status_idx
  ON profissional_fechamento_competencia (status, competencia DESC);

CREATE TRIGGER profissional_fechamento_competencia_atualizado_em
  BEFORE UPDATE ON profissional_fechamento_competencia
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

COMMENT ON TABLE profissional_fechamento_competencia IS
  'Fechamento de competência pelo profissional (NF + PIX). Escopo via JWT sub.';

ALTER TABLE profissional_fechamento_competencia ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE profissional_fechamento_competencia FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profissional_fechamento_competencia TO service_role;
