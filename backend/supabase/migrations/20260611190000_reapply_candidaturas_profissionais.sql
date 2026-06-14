-- Reaplica schema de candidaturas quando tipos existem mas tabelas/view foram perdidas

CREATE TABLE IF NOT EXISTS usuarios_profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf CHAR(11) NOT NULL,
  nome TEXT NOT NULL,
  email CITEXT,
  senha_hash TEXT NOT NULL DEFAULT '$argon2id$v=19$m=65536,t=3,p=4$placeholder$placeholder',
  especialidade TEXT NOT NULL DEFAULT '',
  status status_usuario_admin NOT NULL DEFAULT 'ativo',
  tentativas_login_falhas SMALLINT NOT NULL DEFAULT 0,
  bloqueado_ate TIMESTAMPTZ,
  ultimo_login_em TIMESTAMPTZ,
  senha_alterada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_profissionais_cpf_digitos CHECK (cpf ~ '^[0-9]{11}$'),
  CONSTRAINT usuarios_profissionais_tentativas_nao_negativas CHECK (tentativas_login_falhas >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_profissionais_cpf_uidx ON usuarios_profissionais (cpf);
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_profissionais_email_uidx
  ON usuarios_profissionais (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS usuarios_profissionais_status_idx ON usuarios_profissionais (status);

DROP TRIGGER IF EXISTS usuarios_profissionais_definir_atualizado_em ON usuarios_profissionais;
CREATE TRIGGER usuarios_profissionais_definir_atualizado_em
  BEFORE UPDATE ON usuarios_profissionais
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE IF NOT EXISTS candidaturas_profissionais (
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
  codigo_acesso_hash TEXT,
  codigo_acesso_expira_em TIMESTAMPTZ,
  codigo_acesso TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT candidaturas_profissionais_cpf_format CHECK (cpf ~ '^[0-9]{11}$'),
  CONSTRAINT candidaturas_profissionais_conselho_uf_format CHECK (conselho_uf ~ '^[A-Z]{2}$'),
  CONSTRAINT candidaturas_profissionais_nome_nao_vazio CHECK (char_length(trim(nome_completo)) > 0),
  CONSTRAINT candidaturas_profissionais_email_nao_vazio CHECK (char_length(trim(email::text)) > 0)
);

CREATE INDEX IF NOT EXISTS candidaturas_profissionais_status_idx
  ON candidaturas_profissionais (status, criado_em DESC);
CREATE INDEX IF NOT EXISTS candidaturas_profissionais_especialidade_idx
  ON candidaturas_profissionais (especialidade_id);
CREATE INDEX IF NOT EXISTS candidaturas_profissionais_analista_idx
  ON candidaturas_profissionais (analista_admin_id)
  WHERE analista_admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS candidaturas_profissionais_profissional_idx
  ON candidaturas_profissionais (profissional_id)
  WHERE profissional_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS candidaturas_profissionais_cpf_ativa_uidx
  ON candidaturas_profissionais (cpf)
  WHERE status IN ('pendente', 'em_analise', 'correcao_solicitada');
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidaturas_codigo_acesso_ativo
  ON candidaturas_profissionais (codigo_acesso)
  WHERE codigo_acesso IS NOT NULL AND finalizada_em IS NULL;

DROP TRIGGER IF EXISTS candidaturas_profissionais_atualizado_em ON candidaturas_profissionais;
CREATE TRIGGER candidaturas_profissionais_atualizado_em
  BEFORE UPDATE ON candidaturas_profissionais
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE IF NOT EXISTS candidatura_documentos (
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

CREATE INDEX IF NOT EXISTS candidatura_documentos_candidatura_idx
  ON candidatura_documentos (candidatura_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS candidatura_documentos_status_idx
  ON candidatura_documentos (candidatura_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS candidatura_documentos_candidatura_tipo_uidx
  ON candidatura_documentos (candidatura_id, tipo)
  WHERE tipo IN ('identidade', 'crm', 'comprovante');

DROP TRIGGER IF EXISTS candidatura_documentos_atualizado_em ON candidatura_documentos;
CREATE TRIGGER candidatura_documentos_atualizado_em
  BEFORE UPDATE ON candidatura_documentos
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE IF NOT EXISTS candidatura_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidatura_id UUID NOT NULL REFERENCES candidaturas_profissionais(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  detalhe TEXT,
  autor_nome TEXT NOT NULL DEFAULT 'Sistema',
  autor_admin_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT candidatura_timeline_titulo_nao_vazio CHECK (char_length(trim(titulo)) > 0)
);

CREATE INDEX IF NOT EXISTS candidatura_timeline_candidatura_idx
  ON candidatura_timeline (candidatura_id, criado_em DESC);

CREATE TABLE IF NOT EXISTS candidatura_empresa_pj (
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

CREATE INDEX IF NOT EXISTS candidatura_empresa_pj_status_idx ON candidatura_empresa_pj (status);

DROP TRIGGER IF EXISTS candidatura_empresa_pj_atualizado_em ON candidatura_empresa_pj;
CREATE TRIGGER candidatura_empresa_pj_atualizado_em
  BEFORE UPDATE ON candidatura_empresa_pj
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE IF NOT EXISTS candidatura_especialidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidatura_id UUID NOT NULL REFERENCES candidaturas_profissionais(id) ON DELETE CASCADE,
  especialidade_id TEXT NOT NULL REFERENCES config_especialidades(id) ON DELETE RESTRICT,
  rqe TEXT NOT NULL,
  ordem SMALLINT NOT NULL DEFAULT 1,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT candidatura_especialidades_ordem_positiva CHECK (ordem > 0),
  CONSTRAINT candidatura_especialidades_rqe_nao_vazio CHECK (char_length(trim(rqe)) > 0),
  CONSTRAINT candidatura_especialidades_rqe_formato CHECK (rqe ~ '^[0-9]{3,8}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS candidatura_especialidades_candidatura_especialidade_uidx
  ON candidatura_especialidades (candidatura_id, especialidade_id);
CREATE UNIQUE INDEX IF NOT EXISTS candidatura_especialidades_candidatura_ordem_uidx
  ON candidatura_especialidades (candidatura_id, ordem);
CREATE INDEX IF NOT EXISTS candidatura_especialidades_candidatura_idx
  ON candidatura_especialidades (candidatura_id, ordem);

DROP VIEW IF EXISTS vw_admin_candidaturas_listagem;
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

ALTER TABLE candidaturas_profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatura_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatura_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatura_empresa_pj ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatura_especialidades ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE candidaturas_profissionais FROM anon, authenticated;
REVOKE ALL ON TABLE candidatura_documentos FROM anon, authenticated;
REVOKE ALL ON TABLE candidatura_timeline FROM anon, authenticated;
REVOKE ALL ON TABLE candidatura_empresa_pj FROM anon, authenticated;
REVOKE ALL ON TABLE candidatura_especialidades FROM anon, authenticated;
REVOKE ALL ON vw_admin_candidaturas_listagem FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE candidaturas_profissionais TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE candidatura_documentos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE candidatura_timeline TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE candidatura_empresa_pj TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE candidatura_especialidades TO service_role;
GRANT SELECT ON vw_admin_candidaturas_listagem TO service_role;
