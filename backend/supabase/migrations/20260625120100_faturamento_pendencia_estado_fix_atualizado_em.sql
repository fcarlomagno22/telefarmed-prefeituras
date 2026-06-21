-- Corrige typo aplicado na migration remota (atualizado_at → atualizado_em).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'faturamento_pendencia_estado'
      AND column_name = 'atualizado_at'
  ) THEN
    ALTER TABLE faturamento_pendencia_estado
      RENAME COLUMN atualizado_at TO atualizado_em;
  END IF;
END $$;
