-- Reaplica fundação de auditoria (idempotente) — acessos + eventos

DO $$ BEGIN
  CREATE TYPE auditoria_portal AS ENUM ('admin', 'prefeitura', 'ubt', 'profissional');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE auditoria_acesso_acao AS ENUM (
    'login_sucesso', 'login_falha', 'logout', 'refresh', 'sessao_revogada'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE auditoria_evento_acao AS ENUM (
    'visualizar', 'inserir', 'editar', 'excluir', 'acao_sensivel'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS auditoria_acessos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal auditoria_portal NOT NULL,
  ator_id UUID,
  ator_nome_snapshot TEXT NOT NULL DEFAULT '',
  cpf_snapshot TEXT NOT NULL DEFAULT '',
  acao auditoria_acesso_acao NOT NULL,
  ip INET,
  user_agent TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT auditoria_acessos_metadata_objeto CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE IF NOT EXISTS auditoria_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal auditoria_portal NOT NULL,
  ator_id UUID,
  ator_tipo TEXT NOT NULL DEFAULT '',
  entidade_contratante_id UUID REFERENCES entidades_contratantes(id) ON DELETE SET NULL,
  unidade_ubt_id UUID REFERENCES unidades_ubt(id) ON DELETE SET NULL,
  profissional_id UUID REFERENCES usuarios_profissionais(id) ON DELETE SET NULL,
  pagina TEXT NOT NULL DEFAULT '',
  acao auditoria_evento_acao NOT NULL,
  recurso_tipo TEXT NOT NULL DEFAULT '',
  recurso_id TEXT NOT NULL DEFAULT '',
  descricao TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT auditoria_eventos_ator_tipo_nao_vazio CHECK (char_length(trim(ator_tipo)) > 0),
  CONSTRAINT auditoria_eventos_pagina_nao_vazia CHECK (char_length(trim(pagina)) > 0),
  CONSTRAINT auditoria_eventos_payload_objeto CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX IF NOT EXISTS auditoria_acessos_created_at_idx ON auditoria_acessos (created_at DESC);
CREATE INDEX IF NOT EXISTS auditoria_acessos_portal_ator_idx ON auditoria_acessos (portal, ator_id);
CREATE INDEX IF NOT EXISTS auditoria_eventos_created_at_idx ON auditoria_eventos (created_at DESC);
CREATE INDEX IF NOT EXISTS auditoria_eventos_portal_ator_idx ON auditoria_eventos (portal, ator_id);
CREATE INDEX IF NOT EXISTS auditoria_eventos_entidade_idx ON auditoria_eventos (entidade_contratante_id) WHERE entidade_contratante_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS auditoria_eventos_unidade_ubt_idx ON auditoria_eventos (unidade_ubt_id) WHERE unidade_ubt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS auditoria_eventos_recurso_idx ON auditoria_eventos (recurso_tipo, recurso_id);

ALTER TABLE auditoria_acessos ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_eventos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE auditoria_acessos FROM anon, authenticated;
REVOKE ALL ON TABLE auditoria_eventos FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE auditoria_acessos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE auditoria_eventos TO service_role;
