-- Configurações globais da rede de teleatendimento por entidade (drawer /prefeitura/rede).

ALTER TABLE entidades_contratantes
  ADD COLUMN IF NOT EXISTS config_rede JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN entidades_contratantes.config_rede IS
  'Capacidade diária da rede, limites por UBT, especialidades e consultas avulsas (portal prefeitura).';
