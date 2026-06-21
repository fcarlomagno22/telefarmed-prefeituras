-- Profissionais terceirizados (RH3/Doc24): cadastro mínimo por nome + especialidade.

CREATE TABLE IF NOT EXISTS profissionais_mt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  especialidade TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profissionais_mt_nome_especialidade_uidx UNIQUE (nome, especialidade)
);

COMMENT ON TABLE profissionais_mt IS
  'Profissionais de teleconsulta terceirizada (MT), identificados por nome e especialidade.';

COMMENT ON COLUMN profissionais_mt.nome IS
  'Nome do profissional retornado pela RH3/Doc24.';

COMMENT ON COLUMN profissionais_mt.especialidade IS
  'Nome da especialidade clínica (catálogo local / contrato).';

ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS profissional_mt_id UUID REFERENCES profissionais_mt(id) ON DELETE SET NULL;

COMMENT ON COLUMN consultas.profissional_mt_id IS
  'Profissional terceirizado (MT) vinculado à consulta agendada via RH3.';

CREATE INDEX IF NOT EXISTS consultas_profissional_mt_idx
  ON consultas (profissional_mt_id)
  WHERE profissional_mt_id IS NOT NULL;

ALTER TABLE profissionais_mt ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE profissionais_mt FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profissionais_mt TO service_role;
