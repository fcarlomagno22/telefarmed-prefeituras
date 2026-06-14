-- Etapa 4.5 — idempotência do contador de consultas + índice para fila profissional

ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS contabilizada_em TIMESTAMPTZ;

COMMENT ON COLUMN consultas.contabilizada_em IS
  'Timestamp da contabilização em contratos_entidade.consultas_realizadas (uma vez por consulta concluída).';

CREATE INDEX IF NOT EXISTS consultas_status_criado_idx
  ON consultas (status, criado_em);
