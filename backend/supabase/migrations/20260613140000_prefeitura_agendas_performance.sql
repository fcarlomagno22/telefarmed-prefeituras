-- Índices para agregações de agenda no portal prefeitura

CREATE INDEX IF NOT EXISTS agenda_consultas_entidade_data_unidade_status_idx
  ON agenda_consultas (entidade_contratante_id, data, unidade_ubt_id, status);

CREATE INDEX IF NOT EXISTS agenda_consultas_entidade_data_hora_idx
  ON agenda_consultas (entidade_contratante_id, data, hora)
  WHERE status NOT IN ('cancelado');
