-- BPA-I teleconsulta médica: CNS do profissional + configuração institucional do export.

ALTER TABLE usuarios_profissionais
  ADD COLUMN IF NOT EXISTS cns TEXT;

COMMENT ON COLUMN usuarios_profissionais.cns IS
  'Cartão Nacional de Saúde do profissional executante (obrigatório para BPA-I).';

ALTER TABLE entidades_contratantes
  ADD COLUMN IF NOT EXISTS config_faturamento_sus JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN entidades_contratantes.config_faturamento_sus IS
  'Parâmetros do BPA-Magnético: cnesExecutante, responsavelNome, responsavelSigla, responsavelCnpjCpf, destinatarioNome, destinoIndicador (M|E), versaoSistema.';
