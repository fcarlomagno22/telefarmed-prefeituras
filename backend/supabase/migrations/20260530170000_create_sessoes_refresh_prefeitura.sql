-- Sessões refresh do portal municipal (/prefeitura/*)

CREATE TABLE sessoes_refresh_prefeitura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios_prefeitura(id) ON DELETE CASCADE,
  hash_token TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  revogado_em TIMESTAMPTZ,
  substituido_por_id UUID REFERENCES sessoes_refresh_prefeitura(id) ON DELETE SET NULL,
  agente_usuario TEXT,
  endereco_ip INET
);

CREATE UNIQUE INDEX sessoes_refresh_prefeitura_hash_token_uidx
  ON sessoes_refresh_prefeitura (hash_token);

CREATE INDEX sessoes_refresh_prefeitura_usuario_ativo_idx
  ON sessoes_refresh_prefeitura (usuario_id, expira_em DESC)
  WHERE revogado_em IS NULL;

ALTER TABLE sessoes_refresh_prefeitura ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE sessoes_refresh_prefeitura FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sessoes_refresh_prefeitura TO service_role;
