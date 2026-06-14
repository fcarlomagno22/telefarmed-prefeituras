-- Índices para consultas do monitor operacional da prefeitura (live grid, timeline, ranking)

CREATE INDEX IF NOT EXISTS consultas_entidade_unidade_periodo_idx
  ON consultas (entidade_contratante_id, unidade_ubt_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS consultas_entidade_unidade_ativas_idx
  ON consultas (entidade_contratante_id, unidade_ubt_id, status)
  WHERE status IN ('aguardando_medico', 'em_andamento');

CREATE INDEX IF NOT EXISTS fila_espera_entidade_unidade_status_idx
  ON fila_espera (entidade_contratante_id, unidade_ubt_id, status)
  WHERE status IN ('aguardando', 'chamado', 'em_atendimento');

CREATE INDEX IF NOT EXISTS fila_espera_entidade_unidade_chegada_idx
  ON fila_espera (entidade_contratante_id, unidade_ubt_id, chegada_em DESC)
  WHERE status IN ('finalizado', 'desistiu');
