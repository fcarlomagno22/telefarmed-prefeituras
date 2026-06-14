-- Código de acesso para finalização do cadastro profissional (hash + expiração)
ALTER TABLE candidaturas_profissionais
  ADD COLUMN IF NOT EXISTS codigo_acesso_hash TEXT,
  ADD COLUMN IF NOT EXISTS codigo_acesso_expira_em TIMESTAMPTZ;

COMMENT ON COLUMN candidaturas_profissionais.codigo_acesso_hash IS
  'Hash Argon2 do código numérico enviado ao candidato após aprovação.';
