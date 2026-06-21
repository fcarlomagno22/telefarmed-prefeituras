-- Campos SUS do profissional terceirizado (executante BPA / pendências).

ALTER TABLE profissionais_mt
  ADD COLUMN IF NOT EXISTS conselho_sigla TEXT NOT NULL DEFAULT 'CRM',
  ADD COLUMN IF NOT EXISTS conselho_numero TEXT,
  ADD COLUMN IF NOT EXISTS conselho_uf CHAR(2),
  ADD COLUMN IF NOT EXISTS cns TEXT,
  ADD COLUMN IF NOT EXISTS cbo_codigo TEXT,
  ADD COLUMN IF NOT EXISTS cbo_descricao TEXT,
  ADD COLUMN IF NOT EXISTS formacao TEXT NOT NULL DEFAULT 'medicina',
  ADD COLUMN IF NOT EXISTS rh3_professional_id BIGINT;

COMMENT ON COLUMN profissionais_mt.conselho_numero IS
  'Número do conselho profissional (ex.: CRM).';

COMMENT ON COLUMN profissionais_mt.cns IS
  'Cartão Nacional de Saúde do executante (15 dígitos).';

COMMENT ON COLUMN profissionais_mt.cbo_codigo IS
  'CBO do executante para compatibilidade SIGTAP/BPA.';

COMMENT ON COLUMN profissionais_mt.rh3_professional_id IS
  'Identificador do profissional na RH3/Doc24, quando disponível.';

CREATE INDEX IF NOT EXISTS profissionais_mt_rh3_professional_idx
  ON profissionais_mt (rh3_professional_id)
  WHERE rh3_professional_id IS NOT NULL;
