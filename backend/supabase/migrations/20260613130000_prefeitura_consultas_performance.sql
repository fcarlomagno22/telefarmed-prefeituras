-- Índices para agregações de consultas no portal prefeitura

CREATE INDEX IF NOT EXISTS consultas_entidade_criado_status_idx
  ON consultas (entidade_contratante_id, criado_em DESC, status);

CREATE INDEX IF NOT EXISTS consultas_entidade_unidade_especialidade_idx
  ON consultas (entidade_contratante_id, unidade_ubt_id, especialidade_id, criado_em DESC);
