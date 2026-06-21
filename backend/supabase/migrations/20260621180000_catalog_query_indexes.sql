-- Índices para leituras frequentes de catálogo (unidades, contratos ativos, config ativo).

-- Unidades ativas por entidade (rede, credenciais, agendas).
CREATE INDEX IF NOT EXISTS unidades_ubt_entidade_ativo_nome_idx
  ON unidades_ubt (entidade_contratante_id, nome)
  WHERE status = 'ativo';

-- Contratos ativos/implantação por entidade (especialidades triagem/agenda).
CREATE INDEX IF NOT EXISTS contratos_entidade_entidade_ativo_idx
  ON contratos_entidade (entidade_contratante_id)
  WHERE status IN ('ativo', 'implantacao');

-- Entidades ativas para selects de referência (admin credenciais).
CREATE INDEX IF NOT EXISTS entidades_contratantes_ativo_municipio_idx
  ON entidades_contratantes (municipio, uf)
  WHERE status = 'ativo';

-- Responsáveis UBT por entidade/unidade (listagem de rede).
CREATE INDEX IF NOT EXISTS usuarios_ubt_entidade_unidade_responsavel_ativo_idx
  ON usuarios_ubt (entidade_contratante_id, unidade_ubt_id)
  WHERE eh_responsavel_ubt = true AND status = 'ativo';
