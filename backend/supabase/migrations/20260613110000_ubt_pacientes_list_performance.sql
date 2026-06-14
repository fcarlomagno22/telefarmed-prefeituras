-- Índices para listagem e filtros da página UBT Usuários

CREATE INDEX IF NOT EXISTS paciente_anotacoes_entidade_criado_idx
  ON paciente_anotacoes (entidade_contratante_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS paciente_anotacoes_paciente_criado_idx
  ON paciente_anotacoes (paciente_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS paciente_registros_contato_entidade_criado_idx
  ON paciente_registros_contato (entidade_contratante_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS paciente_registros_contato_paciente_criado_idx
  ON paciente_registros_contato (paciente_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS consultas_paciente_criado_idx
  ON consultas (paciente_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS pacientes_entidade_status_criado_idx
  ON pacientes (entidade_contratante_id, status, criado_em DESC);

CREATE INDEX IF NOT EXISTS paciente_vinculos_ubt_unidade_paciente_idx
  ON paciente_vinculos_ubt (unidade_ubt_id, paciente_id);
