-- Recuperação de senha do app cidadão (VD) — código por e-mail + tokens opacos

CREATE TABLE IF NOT EXISTS vd_recuperacao_senha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credencial_id UUID NOT NULL REFERENCES paciente_credenciais(id) ON DELETE CASCADE,
  hash_token_reset TEXT NOT NULL,
  hash_token_verificacao TEXT,
  hash_codigo TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  verificado_em TIMESTAMPTZ,
  concluido_em TIMESTAMPTZ,
  tentativas_codigo SMALLINT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vd_recuperacao_credencial
  ON vd_recuperacao_senha (credencial_id);

CREATE INDEX IF NOT EXISTS idx_vd_recuperacao_reset_hash
  ON vd_recuperacao_senha (hash_token_reset)
  WHERE concluido_em IS NULL;

CREATE INDEX IF NOT EXISTS idx_vd_recuperacao_verificacao_hash
  ON vd_recuperacao_senha (hash_token_verificacao)
  WHERE concluido_em IS NULL AND verificado_em IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vd_recuperacao_expira
  ON vd_recuperacao_senha (expira_em);

ALTER TABLE vd_recuperacao_senha ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE vd_recuperacao_senha FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE vd_recuperacao_senha TO service_role;

COMMENT ON TABLE vd_recuperacao_senha IS
  'Fluxo de recuperação de senha do app cidadão (VD): código por e-mail vinculado a paciente_credenciais.';
