-- Reaplica perfil estendido de profissionais ativos e view admin quando ausentes

DO $$ BEGIN
  CREATE TYPE status_plantao_profissional AS ENUM (
    'disponivel',
    'indisponivel',
    'em_atendimento'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alocacao_profissional AS ENUM (
    'nacional',
    'por_contrato'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE usuarios_profissionais
  ADD COLUMN IF NOT EXISTS especialidade_id TEXT REFERENCES config_especialidades(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS formacao formacao_candidatura_profissional,
  ADD COLUMN IF NOT EXISTS conselho_sigla TEXT,
  ADD COLUMN IF NOT EXISTS conselho_numero TEXT,
  ADD COLUMN IF NOT EXISTS conselho_uf CHAR(2),
  ADD COLUMN IF NOT EXISTS rqe TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS rg TEXT,
  ADD COLUMN IF NOT EXISTS data_nascimento DATE,
  ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS foto_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS endereco JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS dados_pj JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS assinatura JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS rating_media NUMERIC(4, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_total INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_plantao status_plantao_profissional NOT NULL DEFAULT 'indisponivel',
  ADD COLUMN IF NOT EXISTS plantao_rotulo TEXT NOT NULL DEFAULT 'Indisponível',
  ADD COLUMN IF NOT EXISTS alocacao alocacao_profissional NOT NULL DEFAULT 'nacional',
  ADD COLUMN IF NOT EXISTS entidade_contratante_id UUID REFERENCES entidades_contratantes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS online_ate TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pacientes_mes_atual INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS permissoes_paginas JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS usuarios_profissionais_especialidade_idx
  ON usuarios_profissionais (especialidade_id)
  WHERE especialidade_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS usuarios_profissionais_alocacao_idx
  ON usuarios_profissionais (alocacao, status);

CREATE INDEX IF NOT EXISTS usuarios_profissionais_entidade_idx
  ON usuarios_profissionais (entidade_contratante_id)
  WHERE entidade_contratante_id IS NOT NULL;

UPDATE usuarios_profissionais u
SET
  especialidade_id = COALESCE(u.especialidade_id, c.especialidade_id),
  formacao = COALESCE(u.formacao, c.formacao),
  conselho_sigla = COALESCE(u.conselho_sigla, c.conselho_sigla),
  conselho_numero = COALESCE(u.conselho_numero, c.conselho_numero),
  conselho_uf = COALESCE(u.conselho_uf, c.conselho_uf),
  rqe = COALESCE(u.rqe, c.rqe),
  telefone = COALESCE(u.telefone, c.telefone),
  bio = CASE WHEN trim(u.bio) = '' THEN COALESCE(c.descricao_profissional, '') ELSE u.bio END,
  endereco = CASE WHEN u.endereco = '{}'::jsonb THEN COALESCE(c.endereco, '{}'::jsonb) ELSE u.endereco END,
  data_nascimento = COALESCE(u.data_nascimento, c.data_nascimento)
FROM candidaturas_profissionais c
WHERE c.profissional_id = u.id;

UPDATE usuarios_profissionais u
SET dados_pj = jsonb_strip_nulls(
  jsonb_build_object(
    'cnpj', ep.cnpj,
    'razaoSocial', ep.razao_social,
    'municipio', ep.municipio,
    'uf', ep.uf,
    'pixTipo', ep.dados_bancarios->>'pixTipo',
    'pixChave', ep.dados_bancarios->>'pixChave',
    'bancoNome', ep.dados_bancarios->>'bancoNome',
    'bancoCodigo', ep.dados_bancarios->>'bancoCodigo',
    'agencia', ep.dados_bancarios->>'agencia',
    'conta', ep.dados_bancarios->>'conta',
    'tipoConta', ep.dados_bancarios->>'tipoConta'
  )
)
FROM candidaturas_profissionais c
INNER JOIN candidatura_empresa_pj ep ON ep.candidatura_id = c.id
WHERE c.profissional_id = u.id
  AND ep.status = 'vinculada'
  AND u.dados_pj = '{}'::jsonb;

UPDATE usuarios_profissionais u
SET especialidade_id = e.id
FROM config_especialidades e
WHERE u.especialidade_id IS NULL
  AND trim(u.especialidade) <> ''
  AND lower(e.nome) = lower(u.especialidade);

DROP VIEW IF EXISTS vw_admin_profissionais_ativos;
CREATE VIEW vw_admin_profissionais_ativos AS
SELECT
  u.id,
  u.cpf,
  u.nome,
  u.email,
  u.telefone,
  u.rg,
  u.formacao,
  u.especialidade_id,
  COALESCE(e.nome, u.especialidade, '') AS especialidade_nome,
  u.conselho_sigla,
  u.conselho_numero,
  u.conselho_uf,
  u.rqe,
  u.bio,
  u.foto_storage_path,
  u.endereco,
  u.dados_pj,
  u.assinatura,
  u.rating_media,
  u.rating_total,
  u.status,
  u.status_plantao,
  u.plantao_rotulo,
  u.alocacao,
  u.entidade_contratante_id,
  ec.razao_social AS entidade_razao_social,
  ec.municipio AS entidade_municipio,
  ec.uf AS entidade_uf,
  u.online_ate,
  u.pacientes_mes_atual,
  u.ultimo_login_em,
  u.data_nascimento,
  u.criado_em,
  u.atualizado_em,
  (u.online_ate IS NOT NULL AND u.online_ate > now()) AS online_agora
FROM usuarios_profissionais u
LEFT JOIN config_especialidades e ON e.id = u.especialidade_id
LEFT JOIN entidades_contratantes ec ON ec.id = u.entidade_contratante_id;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profissionais-fotos',
  'profissionais-fotos',
  false,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

REVOKE ALL ON vw_admin_profissionais_ativos FROM anon, authenticated;
GRANT SELECT ON vw_admin_profissionais_ativos TO service_role;
