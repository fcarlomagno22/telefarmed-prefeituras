-- Dados operacionais das UBTs (gestão prefeitura — não credenciais).

ALTER TABLE unidades_ubt
  ADD COLUMN IF NOT EXISTS cnes TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tipo_unidade TEXT NOT NULL DEFAULT 'fixa',
  ADD COLUMN IF NOT EXISTS endereco JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS telefone TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS capacidade_diaria INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS especialidades TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notas TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS terminais_total INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS terminais_manutencao INTEGER[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS estado_operacional TEXT NOT NULL DEFAULT 'ativa';

ALTER TABLE unidades_ubt DROP CONSTRAINT IF EXISTS unidades_ubt_tipo_unidade_check;
ALTER TABLE unidades_ubt
  ADD CONSTRAINT unidades_ubt_tipo_unidade_check
  CHECK (tipo_unidade IN ('fixa', 'movel'));

ALTER TABLE unidades_ubt DROP CONSTRAINT IF EXISTS unidades_ubt_estado_operacional_check;
ALTER TABLE unidades_ubt
  ADD CONSTRAINT unidades_ubt_estado_operacional_check
  CHECK (estado_operacional IN ('ativa', 'manutencao', 'inativa'));

ALTER TABLE unidades_ubt DROP CONSTRAINT IF EXISTS unidades_ubt_terminais_total_check;
ALTER TABLE unidades_ubt
  ADD CONSTRAINT unidades_ubt_terminais_total_check
  CHECK (terminais_total >= 0);

ALTER TABLE unidades_ubt DROP CONSTRAINT IF EXISTS unidades_ubt_capacidade_diaria_check;
ALTER TABLE unidades_ubt
  ADD CONSTRAINT unidades_ubt_capacidade_diaria_check
  CHECK (capacidade_diaria >= 0);

UPDATE unidades_ubt
SET terminais_total = 2
WHERE terminais_total IS NULL OR terminais_total < 1;
