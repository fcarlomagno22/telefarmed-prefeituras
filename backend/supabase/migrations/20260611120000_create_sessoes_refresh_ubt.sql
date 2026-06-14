-- Sessões refresh do terminal UBT (/ubt/*)

CREATE TABLE IF NOT EXISTS sessoes_refresh_ubt (
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

CREATE UNIQUE INDEX IF NOT EXISTS sessoes_refresh_ubt_hash_token_uidx
  ON sessoes_refresh_ubt (hash_token);

CREATE INDEX IF NOT EXISTS sessoes_refresh_ubt_usuario_ativo_idx
  ON sessoes_refresh_ubt (usuario_id, expira_em DESC)
  WHERE revogado_em IS NULL;

ALTER TABLE sessoes_refresh_ubt ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE sessoes_refresh_ubt FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sessoes_refresh_ubt TO service_role;
