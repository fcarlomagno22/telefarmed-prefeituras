-- Código de acesso ativo (6 dígitos) — único entre candidaturas não finalizadas.
-- Liberado ao concluir finalizar-cadastro para permitir reutilização futura.

ALTER TABLE candidaturas_profissionais
  ADD COLUMN IF NOT EXISTS codigo_acesso TEXT;

COMMENT ON COLUMN candidaturas_profissionais.codigo_acesso IS
  'PIN de 6 dígitos ativo até finalização. Único entre candidaturas em aberto; pode ser reutilizado depois.';

CREATE UNIQUE INDEX IF NOT EXISTS idx_candidaturas_codigo_acesso_ativo
  ON candidaturas_profissionais (codigo_acesso)
  WHERE codigo_acesso IS NOT NULL AND finalizada_em IS NULL;
