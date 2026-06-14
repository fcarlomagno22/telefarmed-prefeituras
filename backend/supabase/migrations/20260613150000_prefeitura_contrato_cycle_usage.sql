-- Índice para contagem de consultas realizadas no ciclo mensal (portal prefeitura)

CREATE INDEX IF NOT EXISTS consultas_entidade_finalizada_concluida_idx
  ON consultas (entidade_contratante_id, finalizada_em DESC)
  WHERE status = 'concluida';
