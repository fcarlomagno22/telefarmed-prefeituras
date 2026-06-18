-- Whitelabel por entidade: tipo, cor, nome de marca e terminologia (Fase 1)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_entidade') THEN
    CREATE TYPE tipo_entidade AS ENUM ('prefeitura', 'santa_casa', 'generico');
  END IF;
END
$$;

ALTER TABLE entidades_contratantes
  ADD COLUMN IF NOT EXISTS tipo_entidade tipo_entidade NOT NULL DEFAULT 'prefeitura',
  ADD COLUMN IF NOT EXISTS cor_primaria TEXT,
  ADD COLUMN IF NOT EXISTS nome_marca TEXT,
  ADD COLUMN IF NOT EXISTS terminologia JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN entidades_contratantes.tipo_entidade IS
  'Perfil da entidade contratante: prefeitura, santa_casa ou generico.';
COMMENT ON COLUMN entidades_contratantes.cor_primaria IS
  'Cor primária da marca (#RRGGBB). Quando nula, deriva de logo_hue ou padrão da plataforma.';
COMMENT ON COLUMN entidades_contratantes.nome_marca IS
  'Nome exibido nos portais e PDFs no lugar da marca da plataforma. Quando nulo, usa nome_exibicao.';
COMMENT ON COLUMN entidades_contratantes.terminologia IS
  'Overrides opcionais das chaves de copy (rede, gestao, portal_gestao, contrato, operador_plataforma, satisfacao_publico).';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'entidades_contratantes_cor_primaria_hex'
  ) THEN
    ALTER TABLE entidades_contratantes
      ADD CONSTRAINT entidades_contratantes_cor_primaria_hex CHECK (
        cor_primaria IS NULL OR cor_primaria ~ '^#[0-9A-Fa-f]{6}$'
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS entidades_contratantes_tipo_entidade_idx
  ON entidades_contratantes (tipo_entidade);
