-- Performance para listagem mensal de consultas no drawer de contrato (portal prefeitura)

CREATE INDEX IF NOT EXISTS consultas_entidade_finalizada_status_idx
  ON consultas (entidade_contratante_id, finalizada_em ASC)
  WHERE status = 'concluida';
