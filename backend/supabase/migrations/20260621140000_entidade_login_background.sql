-- Fundo personalizado das telas de login (portal de gestão e UBT da entidade).

ALTER TABLE entidades_contratantes
  ADD COLUMN IF NOT EXISTS login_background_storage_path TEXT;

CREATE INDEX IF NOT EXISTS entidades_contratantes_login_background_storage_path_idx
  ON entidades_contratantes (login_background_storage_path)
  WHERE login_background_storage_path IS NOT NULL;
