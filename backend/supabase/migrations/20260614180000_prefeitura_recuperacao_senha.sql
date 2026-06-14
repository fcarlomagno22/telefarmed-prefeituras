-- Recuperação de senha para usuários do portal da prefeitura (código por e-mail + tokens opacos)
CREATE TABLE IF NOT EXISTS prefeitura_recuperacao_senha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_prefeitura_id UUID NOT NULL REFERENCES usuarios_prefeitura(id) ON DELETE CASCADE,
  hash_token_reset TEXT NOT NULL,
  hash_token_verificacao TEXT,
  hash_codigo TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  verificado_em TIMESTAMPTZ,
  concluido_em TIMESTAMPTZ,
  tentativas_codigo SMALLINT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prefeitura_recuperacao_usuario
  ON prefeitura_recuperacao_senha (usuario_prefeitura_id);

CREATE INDEX IF NOT EXISTS idx_prefeitura_recuperacao_reset_hash
  ON prefeitura_recuperacao_senha (hash_token_reset)
  WHERE concluido_em IS NULL;

CREATE INDEX IF NOT EXISTS idx_prefeitura_recuperacao_verificacao_hash
  ON prefeitura_recuperacao_senha (hash_token_verificacao)
  WHERE concluido_em IS NULL AND verificado_em IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prefeitura_recuperacao_expira
  ON prefeitura_recuperacao_senha (expira_em);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE prefeitura_recuperacao_senha TO service_role;
