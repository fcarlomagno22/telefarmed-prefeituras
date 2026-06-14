-- Alinha nomes financeiro fechamentos/NF ao schema canônico usado pelo backend.
-- Idempotente: seguro se produção já usa fechamentos_competencia ou se migration antiga criou financeiro_*.

DO $$
BEGIN
  IF to_regclass('public.financeiro_fechamentos_competencia') IS NOT NULL
     AND to_regclass('public.fechamentos_competencia') IS NULL THEN
    ALTER TABLE financeiro_fechamentos_competencia RENAME TO fechamentos_competencia;
  END IF;

  IF to_regclass('public.financeiro_notas_fiscais') IS NOT NULL
     AND to_regclass('public.notas_fiscais_fechamento') IS NULL THEN
    ALTER TABLE financeiro_notas_fiscais RENAME TO notas_fiscais_fechamento;
  END IF;
END $$;

-- competencia → competencia_mes (se migration antiga usou nome curto)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fechamentos_competencia'
      AND column_name = 'competencia'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fechamentos_competencia'
      AND column_name = 'competencia_mes'
  ) THEN
    ALTER TABLE fechamentos_competencia RENAME COLUMN competencia TO competencia_mes;
  END IF;
END $$;

-- numero_nota → numero
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notas_fiscais_fechamento'
      AND column_name = 'numero_nota'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notas_fiscais_fechamento'
      AND column_name = 'numero'
  ) THEN
    ALTER TABLE notas_fiscais_fechamento RENAME COLUMN numero_nota TO numero;
  END IF;
END $$;

-- Bucket canônico (aceita alias legado notas-fiscais)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notas-fiscais-fechamento',
  'notas-fiscais-fechamento',
  false,
  5242880,
  ARRAY['application/pdf']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Renomeia índices/triggers se ainda usarem prefixo financeiro_ (best-effort)
DO $$
BEGIN
  IF to_regclass('public.financeiro_fechamentos_competencia_unico') IS NOT NULL THEN
    ALTER INDEX financeiro_fechamentos_competencia_unico
      RENAME TO fechamentos_competencia_unico;
  END IF;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE fechamentos_competencia TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE notas_fiscais_fechamento TO service_role;
