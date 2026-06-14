-- Comunicados multi-portal (admin, prefeitura, UBT, profissional)

CREATE TYPE prioridade_comunicado AS ENUM ('normal', 'importante');

CREATE TYPE origem_comunicado AS ENUM (
  'telefarmed',
  'contract_manager',
  'ubt',
  'profissional'
);

CREATE TYPE audiencia_comunicado AS ENUM (
  'contract_manager',
  'ubt_all',
  'ubt_responsible',
  'ubt_user',
  'medico_all',
  'medico_plantao',
  'medico_especialidade'
);

CREATE TYPE remetente_comunicado_tipo AS ENUM (
  'admin',
  'prefeitura',
  'ubt',
  'profissional',
  'sistema'
);

CREATE TYPE destinatario_comunicado_tipo AS ENUM (
  'usuario_prefeitura',
  'usuario_ubt',
  'profissional'
);

-- Profissionais da rede (auth + destinatários de notificações)
CREATE TABLE usuarios_profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf CHAR(11) NOT NULL,
  nome TEXT NOT NULL,
  email CITEXT,
  senha_hash TEXT NOT NULL,
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

CREATE UNIQUE INDEX usuarios_profissionais_cpf_uidx ON usuarios_profissionais (cpf);
CREATE UNIQUE INDEX usuarios_profissionais_email_uidx ON usuarios_profissionais (email) WHERE email IS NOT NULL;
CREATE INDEX usuarios_profissionais_status_idx ON usuarios_profissionais (status);

CREATE TRIGGER usuarios_profissionais_definir_atualizado_em
  BEFORE UPDATE ON usuarios_profissionais
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE comunicados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  corpo TEXT NOT NULL,
  prioridade prioridade_comunicado NOT NULL DEFAULT 'normal',
  origem origem_comunicado NOT NULL,
  audiencia audiencia_comunicado NOT NULL,
  entidade_contratante_id UUID REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  unidade_ubt_id UUID REFERENCES unidades_ubt(id) ON DELETE SET NULL,
  remetente_tipo remetente_comunicado_tipo NOT NULL,
  remetente_admin_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  remetente_prefeitura_id UUID REFERENCES usuarios_prefeitura(id) ON DELETE SET NULL,
  remetente_ubt_id UUID REFERENCES usuarios_ubt(id) ON DELETE SET NULL,
  remetente_profissional_id UUID REFERENCES usuarios_profissionais(id) ON DELETE SET NULL,
  remetente_nome TEXT NOT NULL DEFAULT '',
  especialidade_filtro TEXT,
  alvos_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  destinatarios_resumo TEXT NOT NULL DEFAULT '',
  total_destinatarios INTEGER NOT NULL DEFAULT 0,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT comunicados_titulo_nao_vazio CHECK (char_length(trim(titulo)) > 0),
  CONSTRAINT comunicados_corpo_nao_vazio CHECK (char_length(trim(corpo)) > 0),
  CONSTRAINT comunicados_total_destinatarios_nao_negativo CHECK (total_destinatarios >= 0)
);

CREATE INDEX comunicados_enviado_em_idx ON comunicados (enviado_em DESC);
CREATE INDEX comunicados_entidade_idx ON comunicados (entidade_contratante_id);
CREATE INDEX comunicados_origem_idx ON comunicados (origem);
CREATE INDEX comunicados_remetente_admin_idx ON comunicados (remetente_admin_id) WHERE remetente_admin_id IS NOT NULL;
CREATE INDEX comunicados_remetente_prefeitura_idx ON comunicados (remetente_prefeitura_id) WHERE remetente_prefeitura_id IS NOT NULL;
CREATE INDEX comunicados_remetente_ubt_idx ON comunicados (remetente_ubt_id) WHERE remetente_ubt_id IS NOT NULL;
CREATE INDEX comunicados_busca_idx ON comunicados USING gin (
  to_tsvector(
    'portuguese',
    coalesce(titulo, '') || ' ' || coalesce(corpo, '') || ' ' || coalesce(remetente_nome, '')
  )
);

CREATE TABLE comunicado_destinatarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicado_id UUID NOT NULL REFERENCES comunicados(id) ON DELETE CASCADE,
  tipo destinatario_comunicado_tipo NOT NULL,
  usuario_prefeitura_id UUID REFERENCES usuarios_prefeitura(id) ON DELETE CASCADE,
  usuario_ubt_id UUID REFERENCES usuarios_ubt(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES usuarios_profissionais(id) ON DELETE CASCADE,
  unidade_ubt_id UUID REFERENCES unidades_ubt(id) ON DELETE SET NULL,
  rotulo_destinatario TEXT NOT NULL DEFAULT '',
  lido_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT comunicado_destinatarios_fk_coerente CHECK (
    (tipo = 'usuario_prefeitura' AND usuario_prefeitura_id IS NOT NULL AND usuario_ubt_id IS NULL AND profissional_id IS NULL)
    OR (tipo = 'usuario_ubt' AND usuario_ubt_id IS NOT NULL AND usuario_prefeitura_id IS NULL AND profissional_id IS NULL)
    OR (tipo = 'profissional' AND profissional_id IS NOT NULL AND usuario_prefeitura_id IS NULL AND usuario_ubt_id IS NULL)
  )
);

CREATE INDEX comunicado_destinatarios_comunicado_idx ON comunicado_destinatarios (comunicado_id);
CREATE INDEX comunicado_destinatarios_prefeitura_inbox_idx
  ON comunicado_destinatarios (usuario_prefeitura_id, lido_em)
  WHERE usuario_prefeitura_id IS NOT NULL;
CREATE INDEX comunicado_destinatarios_ubt_inbox_idx
  ON comunicado_destinatarios (usuario_ubt_id, lido_em)
  WHERE usuario_ubt_id IS NOT NULL;
CREATE INDEX comunicado_destinatarios_profissional_inbox_idx
  ON comunicado_destinatarios (profissional_id, lido_em)
  WHERE profissional_id IS NOT NULL;
CREATE UNIQUE INDEX comunicado_destinatarios_prefeitura_uidx
  ON comunicado_destinatarios (comunicado_id, usuario_prefeitura_id)
  WHERE usuario_prefeitura_id IS NOT NULL;
CREATE UNIQUE INDEX comunicado_destinatarios_ubt_uidx
  ON comunicado_destinatarios (comunicado_id, usuario_ubt_id)
  WHERE usuario_ubt_id IS NOT NULL;
CREATE UNIQUE INDEX comunicado_destinatarios_profissional_uidx
  ON comunicado_destinatarios (comunicado_id, profissional_id)
  WHERE profissional_id IS NOT NULL;

-- Sessões refresh UBT e profissional
CREATE TABLE sessoes_refresh_ubt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios_ubt(id) ON DELETE CASCADE,
  hash_token TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  revogado_em TIMESTAMPTZ,
  substituido_por_id UUID REFERENCES sessoes_refresh_ubt(id) ON DELETE SET NULL,
  agente_usuario TEXT,
  endereco_ip INET
);

CREATE UNIQUE INDEX sessoes_refresh_ubt_hash_token_uidx ON sessoes_refresh_ubt (hash_token);
CREATE INDEX sessoes_refresh_ubt_usuario_ativo_idx
  ON sessoes_refresh_ubt (usuario_id, expira_em DESC)
  WHERE revogado_em IS NULL;

CREATE TABLE sessoes_refresh_profissional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios_profissionais(id) ON DELETE CASCADE,
  hash_token TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  revogado_em TIMESTAMPTZ,
  substituido_por_id UUID REFERENCES sessoes_refresh_profissional(id) ON DELETE SET NULL,
  agente_usuario TEXT,
  endereco_ip INET
);

CREATE UNIQUE INDEX sessoes_refresh_profissional_hash_token_uidx ON sessoes_refresh_profissional (hash_token);
CREATE INDEX sessoes_refresh_profissional_usuario_ativo_idx
  ON sessoes_refresh_profissional (usuario_id, expira_em DESC)
  WHERE revogado_em IS NULL;

-- View admin: comunicados enviados pela plataforma
CREATE OR REPLACE VIEW vw_comunicados_admin_listagem AS
SELECT
  c.id,
  c.titulo,
  c.corpo,
  c.prioridade,
  c.remetente_nome AS remetente_nome,
  c.alvos_snapshot,
  c.destinatarios_resumo,
  c.total_destinatarios,
  c.enviado_em
FROM comunicados c
WHERE c.remetente_tipo = 'admin';

ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicado_destinatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_refresh_ubt ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_refresh_profissional ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE comunicados FROM anon, authenticated;
REVOKE ALL ON TABLE comunicado_destinatarios FROM anon, authenticated;
REVOKE ALL ON TABLE usuarios_profissionais FROM anon, authenticated;
REVOKE ALL ON TABLE sessoes_refresh_ubt FROM anon, authenticated;
REVOKE ALL ON TABLE sessoes_refresh_profissional FROM anon, authenticated;
