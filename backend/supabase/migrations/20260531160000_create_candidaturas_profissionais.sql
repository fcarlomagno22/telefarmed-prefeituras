-- Etapa 2.1 — Candidaturas profissionais (ciclo de vida)
-- Domínio cross-tenant: admin analisa; profissional acessa apenas a própria candidatura (JWT sub).

CREATE TYPE status_candidatura_profissional AS ENUM (
  'pendente',
  'em_analise',
  'aprovada',
  'reprovada',
  'correcao_solicitada'
);

CREATE TYPE formacao_candidatura_profissional AS ENUM (
  'medicina',
  'psicologia',
  'nutricao',
  'fonoaudiologia'
);

CREATE TYPE tipo_documento_candidatura AS ENUM (
  'identidade',
  'crm',
  'comprovante',
  'contrato',
  'outro'
);

CREATE TYPE status_documento_candidatura AS ENUM (
  'pendente',
  'aprovado',
  'reprovado'
);

CREATE TYPE status_empresa_candidatura AS ENUM (
  'nao_informado',
  'aguardando_finalizacao',
  'vinculada'
);

CREATE TABLE candidaturas_profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf CHAR(11) NOT NULL,
  nome_completo TEXT NOT NULL,
  email CITEXT NOT NULL,
  telefone TEXT,
  data_nascimento DATE NOT NULL,
  formacao formacao_candidatura_profissional NOT NULL,
  especialidade_id TEXT NOT NULL REFERENCES config_especialidades(id) ON DELETE RESTRICT,
  conselho_sigla TEXT NOT NULL,
  conselho_numero TEXT NOT NULL,
  conselho_uf CHAR(2) NOT NULL,
  rqe TEXT,
  descricao_profissional TEXT NOT NULL DEFAULT '',
  endereco JSONB NOT NULL DEFAULT '{}'::jsonb,
  status status_candidatura_profissional NOT NULL DEFAULT 'pendente',
  analista_admin_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  profissional_id UUID REFERENCES usuarios_profissionais(id) ON DELETE SET NULL,
  enviada_em TIMESTAMPTZ,
  codigo_acesso_enviado_em TIMESTAMPTZ,
  finalizada_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT candidaturas_profissionais_cpf_format CHECK (cpf ~ '^[0-9]{11}$'),
  CONSTRAINT candidaturas_profissionais_conselho_uf_format CHECK (conselho_uf ~ '^[A-Z]{2}$'),
  CONSTRAINT candidaturas_profissionais_nome_nao_vazio CHECK (char_length(trim(nome_completo)) > 0),
  CONSTRAINT candidaturas_profissionais_email_nao_vazio CHECK (char_length(trim(email::text)) > 0)
);

COMMENT ON TABLE candidaturas_profissionais IS
  'Fila de candidaturas ao portal profissional. Cross-tenant (admin Telefarmed). '
  'Portal profissional: escopo fixo candidatura_id/profissional_id derivado do JWT — nunca do body.';

CREATE INDEX candidaturas_profissionais_status_idx
  ON candidaturas_profissionais (status, criado_em DESC);

CREATE INDEX candidaturas_profissionais_especialidade_idx
  ON candidaturas_profissionais (especialidade_id);

CREATE INDEX candidaturas_profissionais_analista_idx
  ON candidaturas_profissionais (analista_admin_id)
  WHERE analista_admin_id IS NOT NULL;

CREATE INDEX candidaturas_profissionais_profissional_idx
  ON candidaturas_profissionais (profissional_id)
  WHERE profissional_id IS NOT NULL;

CREATE UNIQUE INDEX candidaturas_profissionais_cpf_ativa_uidx
  ON candidaturas_profissionais (cpf)
  WHERE status IN ('pendente', 'em_analise', 'correcao_solicitada');

CREATE TRIGGER candidaturas_profissionais_atualizado_em
  BEFORE UPDATE ON candidaturas_profissionais
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE candidatura_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidatura_id UUID NOT NULL REFERENCES candidaturas_profissionais(id) ON DELETE CASCADE,
  tipo tipo_documento_candidatura NOT NULL,
  rotulo TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  tamanho_bytes INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  status status_documento_candidatura NOT NULL DEFAULT 'pendente',
  motivo_reprovacao TEXT,
  complemento_solicitado_em TIMESTAMPTZ,
  revisado_por_admin_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  revisado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT candidatura_documentos_rotulo_nao_vazio CHECK (char_length(trim(rotulo)) > 0),
  CONSTRAINT candidatura_documentos_nome_arquivo_nao_vazio CHECK (char_length(trim(nome_arquivo)) > 0),
  CONSTRAINT candidatura_documentos_tamanho_max CHECK (
    tamanho_bytes > 0 AND tamanho_bytes <= 10485760
  ),
  CONSTRAINT candidatura_documentos_storage_path_unico UNIQUE (storage_path)
);

CREATE INDEX candidatura_documentos_candidatura_idx
  ON candidatura_documentos (candidatura_id, criado_em DESC);

CREATE INDEX candidatura_documentos_status_idx
  ON candidatura_documentos (candidatura_id, status);

CREATE UNIQUE INDEX candidatura_documentos_candidatura_tipo_uidx
  ON candidatura_documentos (candidatura_id, tipo)
  WHERE tipo IN ('identidade', 'crm', 'comprovante');

CREATE TRIGGER candidatura_documentos_atualizado_em
  BEFORE UPDATE ON candidatura_documentos
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE candidatura_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidatura_id UUID NOT NULL REFERENCES candidaturas_profissionais(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  detalhe TEXT,
  autor_nome TEXT NOT NULL DEFAULT 'Sistema',
  autor_admin_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT candidatura_timeline_titulo_nao_vazio CHECK (char_length(trim(titulo)) > 0)
);

CREATE INDEX candidatura_timeline_candidatura_idx
  ON candidatura_timeline (candidatura_id, criado_em DESC);

CREATE TABLE candidatura_empresa_pj (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidatura_id UUID NOT NULL UNIQUE REFERENCES candidaturas_profissionais(id) ON DELETE CASCADE,
  status status_empresa_candidatura NOT NULL DEFAULT 'nao_informado',
  cnpj CHAR(14),
  razao_social TEXT,
  municipio TEXT,
  uf CHAR(2),
  dados_bancarios JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT candidatura_empresa_pj_cnpj_format CHECK (
    cnpj IS NULL OR cnpj ~ '^[0-9]{14}$'
  ),
  CONSTRAINT candidatura_empresa_pj_uf_format CHECK (
    uf IS NULL OR uf ~ '^[A-Z]{2}$'
  )
);

COMMENT ON COLUMN candidatura_empresa_pj.dados_bancarios IS
  'JSON: bancoNome, bancoCodigo, agencia, conta, tipoConta, pixTipo, pixChave.';

CREATE INDEX candidatura_empresa_pj_status_idx
  ON candidatura_empresa_pj (status);

CREATE TRIGGER candidatura_empresa_pj_atualizado_em
  BEFORE UPDATE ON candidatura_empresa_pj
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

-- View de listagem admin (sem documentos/timeline — performance)
CREATE VIEW vw_admin_candidaturas_listagem AS
SELECT
  c.id,
  c.cpf,
  c.nome_completo,
  c.email,
  c.telefone,
  c.data_nascimento,
  c.formacao,
  c.especialidade_id,
  e.nome AS especialidade_nome,
  c.conselho_sigla,
  c.conselho_numero,
  c.conselho_uf,
  c.rqe,
  c.descricao_profissional,
  c.endereco,
  c.status,
  c.analista_admin_id,
  ua.nome AS analista_nome,
  c.profissional_id,
  c.enviada_em,
  c.codigo_acesso_enviado_em,
  c.finalizada_em,
  c.criado_em,
  c.atualizado_em,
  ep.status AS empresa_status,
  ep.cnpj AS empresa_cnpj,
  ep.razao_social AS empresa_razao_social
FROM candidaturas_profissionais c
INNER JOIN config_especialidades e ON e.id = c.especialidade_id
LEFT JOIN usuarios_admin ua ON ua.id = c.analista_admin_id
LEFT JOIN candidatura_empresa_pj ep ON ep.candidatura_id = c.id;

-- Bucket privado (upload via backend service_role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidaturas-documentos',
  'candidaturas-documentos',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS: acesso exclusivo via service_role (backend)
ALTER TABLE candidaturas_profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatura_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatura_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatura_empresa_pj ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE candidaturas_profissionais FROM anon, authenticated;
REVOKE ALL ON TABLE candidatura_documentos FROM anon, authenticated;
REVOKE ALL ON TABLE candidatura_timeline FROM anon, authenticated;
REVOKE ALL ON TABLE candidatura_empresa_pj FROM anon, authenticated;
REVOKE ALL ON vw_admin_candidaturas_listagem FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE candidaturas_profissionais TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE candidatura_documentos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE candidatura_timeline TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE candidatura_empresa_pj TO service_role;
GRANT SELECT ON vw_admin_candidaturas_listagem TO service_role;

-- Seed de referência (espelha mock admin — Clínica Geral e Cardiologia)
INSERT INTO candidaturas_profissionais (
  id,
  cpf,
  nome_completo,
  email,
  telefone,
  data_nascimento,
  formacao,
  especialidade_id,
  conselho_sigla,
  conselho_numero,
  conselho_uf,
  rqe,
  descricao_profissional,
  endereco,
  status,
  enviada_em
)
VALUES
  (
    'd2000000-0000-4000-8000-000000000001',
    '32165498701',
    'Dra. Marina Alves Costa',
    'marina.costa@email.com',
    '(11) 98765-4321',
    '1988-08-12',
    'medicina',
    '4',
    'CRM',
    '145872',
    'SP',
    '89456',
    'Médica generalista com experiência em atenção primária e telemedicina.',
    '{"logradouro":"Rua das Palmeiras","numero":"120","cidade":"São Paulo","uf":"SP","bairro":"Centro"}'::jsonb,
    'pendente',
    now() - interval '3 days'
  ),
  (
    'd2000000-0000-4000-8000-000000000002',
    '19876543210',
    'Dr. Ricardo Mendes Lima',
    'ricardo.mendes@clinica.com',
    '(21) 99876-1122',
    '1985-02-03',
    'medicina',
    '7',
    'CRM',
    '98741',
    'RJ',
    NULL,
    'Cardiologista com foco em teleconsulta e acompanhamento crônico.',
    '{"logradouro":"Av. Brasil","numero":"450","cidade":"Rio de Janeiro","uf":"RJ","bairro":"Centro"}'::jsonb,
    'em_analise',
    now() - interval '5 days'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO candidatura_empresa_pj (candidatura_id, status)
SELECT id, 'nao_informado'::status_empresa_candidatura
FROM candidaturas_profissionais
WHERE id IN (
  'd2000000-0000-4000-8000-000000000001',
  'd2000000-0000-4000-8000-000000000002'
)
ON CONFLICT (candidatura_id) DO NOTHING;

INSERT INTO candidatura_timeline (candidatura_id, titulo, detalhe, autor_nome)
SELECT c.id, 'Candidatura enviada', 'Formulário e documentos recebidos pelo portal.', 'Sistema'
FROM candidaturas_profissionais c
WHERE c.id IN (
  'd2000000-0000-4000-8000-000000000001',
  'd2000000-0000-4000-8000-000000000002'
)
AND NOT EXISTS (
  SELECT 1 FROM candidatura_timeline t
  WHERE t.candidatura_id = c.id AND t.titulo = 'Candidatura enviada'
);
