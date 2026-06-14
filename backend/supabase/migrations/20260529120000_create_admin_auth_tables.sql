-- Autenticação admin (backend próprio; sem Supabase Auth)
-- Schema em português — use esta migration em ambientes novos.
-- Ambientes que já rodaram a versão em inglês devem aplicar 20260529130000_renomear_schema_admin_portugues.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE status_usuario_admin AS ENUM ('ativo', 'inativo');
CREATE TYPE nivel_acesso_admin AS ENUM ('administrador', 'operador', 'editor', 'visualizador');
CREATE TYPE departamento_admin AS ENUM ('operacoes', 'comercial', 'financeiro', 'suporte', 'ti', 'diretoria');

CREATE TABLE usuarios_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf CHAR(11) NOT NULL,
  nome TEXT NOT NULL,
  email CITEXT,
  senha_hash TEXT NOT NULL,
  nivel_acesso nivel_acesso_admin NOT NULL DEFAULT 'operador',
  departamento departamento_admin NOT NULL DEFAULT 'operacoes',
  eh_master BOOLEAN NOT NULL DEFAULT false,
  status status_usuario_admin NOT NULL DEFAULT 'ativo',
  pin_autorizacao_hash TEXT,
  tentativas_login_falhas SMALLINT NOT NULL DEFAULT 0,
  bloqueado_ate TIMESTAMPTZ,
  ultimo_login_em TIMESTAMPTZ,
  senha_alterada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT usuarios_admin_cpf_digitos CHECK (cpf ~ '^[0-9]{11}$'),
  CONSTRAINT usuarios_admin_tentativas_login_nao_negativas CHECK (tentativas_login_falhas >= 0)
);

CREATE UNIQUE INDEX usuarios_admin_cpf_uidx ON usuarios_admin (cpf);
CREATE UNIQUE INDEX usuarios_admin_email_uidx ON usuarios_admin (email) WHERE email IS NOT NULL;
CREATE INDEX usuarios_admin_status_idx ON usuarios_admin (status) WHERE status = 'ativo';

CREATE TABLE sessoes_refresh_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios_admin(id) ON DELETE CASCADE,
  hash_token TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  revogado_em TIMESTAMPTZ,
  substituido_por_id UUID REFERENCES sessoes_refresh_admin(id) ON DELETE SET NULL,
  agente_usuario TEXT,
  endereco_ip INET
);

CREATE UNIQUE INDEX sessoes_refresh_admin_hash_token_uidx ON sessoes_refresh_admin (hash_token);
CREATE INDEX sessoes_refresh_admin_usuario_ativo_idx
  ON sessoes_refresh_admin (usuario_id, expira_em DESC)
  WHERE revogado_em IS NULL;

CREATE OR REPLACE FUNCTION public.definir_atualizado_em()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER usuarios_admin_definir_atualizado_em
  BEFORE UPDATE ON usuarios_admin
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

ALTER TABLE usuarios_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_refresh_admin ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE usuarios_admin FROM anon, authenticated;
REVOKE ALL ON TABLE sessoes_refresh_admin FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE usuarios_admin TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sessoes_refresh_admin TO service_role;
