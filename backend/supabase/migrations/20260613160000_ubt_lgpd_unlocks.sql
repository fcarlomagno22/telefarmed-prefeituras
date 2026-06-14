-- Sessões de desbloqueio LGPD para operadores UBT (validadas no servidor)
CREATE TABLE IF NOT EXISTS ubt_lgpd_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_ubt_id UUID NOT NULL REFERENCES usuarios_ubt(id) ON DELETE CASCADE,
  hash_token TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ubt_lgpd_unlocks_usuario
  ON ubt_lgpd_unlocks (usuario_ubt_id);

CREATE INDEX IF NOT EXISTS idx_ubt_lgpd_unlocks_hash
  ON ubt_lgpd_unlocks (hash_token);

CREATE INDEX IF NOT EXISTS idx_ubt_lgpd_unlocks_expira
  ON ubt_lgpd_unlocks (expira_em);
