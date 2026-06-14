-- Controle de leitura do solicitante (portal) nas respostas da equipe Telefarmed
ALTER TABLE chamados_suporte
  ADD COLUMN IF NOT EXISTS solicitante_visualizado_em TIMESTAMPTZ;

COMMENT ON COLUMN chamados_suporte.solicitante_visualizado_em IS
  'Última vez que o solicitante abriu o chat do chamado no portal (UBT, prefeitura ou profissional).';

CREATE INDEX IF NOT EXISTS chamados_suporte_solicitante_visualizado_idx
  ON chamados_suporte (solicitante_visualizado_em DESC NULLS LAST);
