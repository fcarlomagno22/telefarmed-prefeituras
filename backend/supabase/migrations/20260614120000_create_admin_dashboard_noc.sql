-- Dashboard admin: incidentes NOC persistidos (automáticos e manuais)

CREATE TYPE admin_noc_categoria AS ENUM (
  'contract_expiring',
  'package_overflow',
  'ubt_offline',
  'high_queue',
  'integration_failure',
  'security'
);

CREATE TYPE admin_noc_prioridade AS ENUM ('critical', 'high', 'medium');
CREATE TYPE admin_noc_status AS ENUM ('open', 'in_progress', 'resolved');
CREATE TYPE admin_noc_fonte AS ENUM ('automatico', 'manual');

CREATE TABLE admin_noc_incidentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  entidade_contratante_id UUID REFERENCES entidades_contratantes(id) ON DELETE SET NULL,
  municipio_nome TEXT NOT NULL DEFAULT '',
  categoria admin_noc_categoria NOT NULL,
  prioridade admin_noc_prioridade NOT NULL DEFAULT 'medium',
  status admin_noc_status NOT NULL DEFAULT 'open',
  responsavel TEXT,
  time_nome TEXT NOT NULL DEFAULT 'NOC Plataforma',
  sla_interno_horas INTEGER NOT NULL DEFAULT 8,
  sla_interno_estourado BOOLEAN NOT NULL DEFAULT false,
  detectado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  descricao TEXT NOT NULL DEFAULT '',
  impacto TEXT NOT NULL DEFAULT '',
  acao_recomendada TEXT NOT NULL DEFAULT '',
  historico JSONB NOT NULL DEFAULT '[]'::jsonb,
  fonte admin_noc_fonte NOT NULL DEFAULT 'automatico',
  fonte_chave TEXT,
  resolvido_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_noc_incidentes_titulo_nao_vazio CHECK (char_length(trim(titulo)) > 0),
  CONSTRAINT admin_noc_incidentes_sla_horas_positivo CHECK (sla_interno_horas > 0),
  CONSTRAINT admin_noc_incidentes_fonte_chave_unica UNIQUE (fonte_chave)
);

CREATE INDEX admin_noc_incidentes_status_idx ON admin_noc_incidentes (status);
CREATE INDEX admin_noc_incidentes_prioridade_idx ON admin_noc_incidentes (prioridade);
CREATE INDEX admin_noc_incidentes_entidade_idx ON admin_noc_incidentes (entidade_contratante_id);
CREATE INDEX admin_noc_incidentes_detectado_em_idx ON admin_noc_incidentes (detectado_em DESC);
CREATE INDEX admin_noc_incidentes_fonte_idx ON admin_noc_incidentes (fonte);

CREATE TRIGGER admin_noc_incidentes_atualizado_em
  BEFORE UPDATE ON admin_noc_incidentes
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

ALTER TABLE admin_noc_incidentes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE admin_noc_incidentes FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE admin_noc_incidentes TO service_role;
