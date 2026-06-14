-- Recuperação de senha para usuários administrativos (código por e-mail + tokens opacos)
CREATE TABLE IF NOT EXISTS admin_recuperacao_senha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_admin_id UUID NOT NULL REFERENCES usuarios_admin(id) ON DELETE CASCADE,
  hash_token_reset TEXT NOT NULL,
  hash_token_verificacao TEXT,
  hash_codigo TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  verificado_em TIMESTAMPTZ,
  concluido_em TIMESTAMPTZ,
  tentativas_codigo SMALLINT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_recuperacao_usuario
  ON admin_recuperacao_senha (usuario_admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_recuperacao_reset_hash
  ON admin_recuperacao_senha (hash_token_reset)
  WHERE concluido_em IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_recuperacao_verificacao_hash
  ON admin_recuperacao_senha (hash_token_verificacao)
  WHERE concluido_em IS NULL AND verificado_em IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_admin_recuperacao_expira
  ON admin_recuperacao_senha (expira_em);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE admin_recuperacao_senha TO service_role;
