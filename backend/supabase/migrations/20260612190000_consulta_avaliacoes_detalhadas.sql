-- Avaliação em duas dimensões: profissional + experiência da teleconsulta

ALTER TABLE consulta_avaliacoes
  ADD COLUMN IF NOT EXISTS nota_profissional SMALLINT,
  ADD COLUMN IF NOT EXISTS comentario_profissional TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS nota_teleconsulta SMALLINT,
  ADD COLUMN IF NOT EXISTS comentario_teleconsulta TEXT NOT NULL DEFAULT '';

UPDATE consulta_avaliacoes
SET
  nota_profissional = COALESCE(nota_profissional, nota),
  nota_teleconsulta = COALESCE(nota_teleconsulta, nota),
  comentario_profissional = CASE
    WHEN char_length(trim(comentario_profissional)) > 0 THEN comentario_profissional
    ELSE comentario
  END
WHERE nota_profissional IS NULL OR nota_teleconsulta IS NULL;

ALTER TABLE consulta_avaliacoes
  DROP CONSTRAINT IF EXISTS consulta_avaliacoes_nota_profissional_valida,
  DROP CONSTRAINT IF EXISTS consulta_avaliacoes_nota_teleconsulta_valida;

ALTER TABLE consulta_avaliacoes
  ADD CONSTRAINT consulta_avaliacoes_nota_profissional_valida
    CHECK (nota_profissional IS NULL OR nota_profissional BETWEEN 1 AND 5),
  ADD CONSTRAINT consulta_avaliacoes_nota_teleconsulta_valida
    CHECK (nota_teleconsulta IS NULL OR nota_teleconsulta BETWEEN 1 AND 5);

COMMENT ON COLUMN consulta_avaliacoes.nota IS
  'Média legada entre nota_profissional e nota_teleconsulta; mantida para compatibilidade.';
COMMENT ON COLUMN consulta_avaliacoes.nota_profissional IS
  'Nota do paciente sobre o profissional (1–5).';
COMMENT ON COLUMN consulta_avaliacoes.nota_teleconsulta IS
  'Nota do paciente sobre a experiência da teleconsulta (1–5).';
