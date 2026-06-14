-- Índices para agregações do dashboard administrativo

CREATE INDEX IF NOT EXISTS consultas_dashboard_periodo_idx
  ON consultas (criado_em, entidade_contratante_id, status);

CREATE INDEX IF NOT EXISTS consultas_dashboard_duracao_idx
  ON consultas (entidade_contratante_id, finalizada_em)
  WHERE status = 'concluida' AND duracao_minutos IS NOT NULL;

CREATE INDEX IF NOT EXISTS fechamentos_dashboard_competencia_idx
  ON fechamentos_competencia (competencia_mes, contrato_id);

CREATE INDEX IF NOT EXISTS fila_espera_dashboard_unidade_status_idx
  ON fila_espera (unidade_ubt_id, status, chegada_em)
  WHERE status IN ('aguardando', 'chamado');
