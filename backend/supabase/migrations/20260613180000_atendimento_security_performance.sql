-- Segurança e desempenho: portal de auditoria do paciente + índices de consulta.

ALTER TYPE auditoria_portal ADD VALUE IF NOT EXISTS 'atendimento';

CREATE INDEX IF NOT EXISTS consultas_profissional_ativo_idx
  ON consultas (profissional_id, status, criado_em DESC)
  WHERE status IN ('aguardando_medico', 'em_andamento');

CREATE INDEX IF NOT EXISTS consultas_fila_espera_idx
  ON consultas (fila_espera_id)
  WHERE fila_espera_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS consulta_anexos_consulta_origem_idx
  ON consulta_anexos (consulta_id, origem, criado_em DESC);
