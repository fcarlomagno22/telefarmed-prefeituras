-- Especialidades médicas da candidatura (múltiplas com RQE obrigatório)

CREATE TABLE candidatura_especialidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidatura_id UUID NOT NULL REFERENCES candidaturas_profissionais(id) ON DELETE CASCADE,
  especialidade_id TEXT NOT NULL REFERENCES config_especialidades(id) ON DELETE RESTRICT,
  rqe TEXT NOT NULL,
  ordem SMALLINT NOT NULL DEFAULT 1,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT candidatura_especialidades_ordem_positiva CHECK (ordem > 0),
  CONSTRAINT candidatura_especialidades_rqe_nao_vazio CHECK (char_length(trim(rqe)) > 0),
  CONSTRAINT candidatura_especialidades_rqe_formato CHECK (rqe ~ '^[0-9]{3,8}$')
);

CREATE UNIQUE INDEX candidatura_especialidades_candidatura_especialidade_uidx
  ON candidatura_especialidades (candidatura_id, especialidade_id);

CREATE UNIQUE INDEX candidatura_especialidades_candidatura_ordem_uidx
  ON candidatura_especialidades (candidatura_id, ordem);

CREATE INDEX candidatura_especialidades_candidatura_idx
  ON candidatura_especialidades (candidatura_id, ordem);

COMMENT ON TABLE candidatura_especialidades IS
  'Especialidades médicas informadas na candidatura. ordem=1 é a principal (espelha candidaturas_profissionais.especialidade_id/rqe).';

ALTER TABLE candidatura_especialidades ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE candidatura_especialidades FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE candidatura_especialidades TO service_role;

-- Backfill das candidaturas médicas já existentes (quando houver RQE)
INSERT INTO candidatura_especialidades (candidatura_id, especialidade_id, rqe, ordem)
SELECT c.id, c.especialidade_id, trim(c.rqe), 1
FROM candidaturas_profissionais c
WHERE c.formacao = 'medicina'
  AND c.rqe IS NOT NULL
  AND char_length(trim(c.rqe)) >= 3
ON CONFLICT (candidatura_id, especialidade_id) DO NOTHING;
