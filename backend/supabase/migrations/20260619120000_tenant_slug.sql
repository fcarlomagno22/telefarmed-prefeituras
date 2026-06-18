-- Slug público por entidade (gestão) e UBT (terminal) — namespace único na aplicação

ALTER TABLE entidades_contratantes
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS slug_locked_at TIMESTAMPTZ;

ALTER TABLE unidades_ubt
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS slug_locked_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS entidades_contratantes_slug_unique_idx
  ON entidades_contratantes (slug)
  WHERE slug IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unidades_ubt_slug_unique_idx
  ON unidades_ubt (slug)
  WHERE slug IS NOT NULL;

COMMENT ON COLUMN entidades_contratantes.slug IS
  'Subdomínio público da gestão: https://{slug}.telefarmed.com.br';
COMMENT ON COLUMN unidades_ubt.slug IS
  'Subdomínio público do terminal UBT: https://{slug}.telefarmed.com.br';
