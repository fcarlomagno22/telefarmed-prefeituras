-- Índices para listagem de histórico e lookup de sessão por profissional

CREATE INDEX IF NOT EXISTS consultas_profissional_historico_idx
  ON consultas (profissional_id, finalizada_em DESC)
  WHERE profissional_id IS NOT NULL
    AND status IN ('concluida', 'interrompida');

CREATE INDEX IF NOT EXISTS consultas_profissional_codigo_idx
  ON consultas (profissional_id, codigo_atendimento)
  WHERE profissional_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS consultas_codigo_profissional_lookup_idx
  ON consultas (codigo_atendimento, profissional_id);

COMMENT ON INDEX consultas_profissional_historico_idx IS
  'Listagem paginada de atendimentos finalizados no portal profissional.';
