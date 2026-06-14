-- Gestão admin de clientes: dados mestres da entidade e contratos comerciais

CREATE TYPE status_entidade_cliente AS ENUM (
  'ativa',
  'implantacao',
  'prospect',
  'suspensa',
  'sem_contrato'
);

CREATE TYPE status_contrato_entidade AS ENUM (
  'ativo',
  'encerrado',
  'suspenso',
  'implantacao'
);

CREATE TYPE telefone_contato_tipo AS ENUM ('fixo', 'celular');

CREATE TYPE contrato_preco_tipo AS ENUM ('contratado', 'excedente');

ALTER TABLE entidades_contratantes
  ADD COLUMN IF NOT EXISTS nome_exibicao TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subtitulo TEXT NOT NULL DEFAULT 'Prefeitura Municipal',
  ADD COLUMN IF NOT EXISTS cnpj TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_hue SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_cliente status_entidade_cliente NOT NULL DEFAULT 'prospect',
  ADD COLUMN IF NOT EXISTS gestor JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contato_contrato JSONB,
  ADD COLUMN IF NOT EXISTS contato_ti JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contato_saude JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE entidades_contratantes
SET
  nome_exibicao = COALESCE(NULLIF(nome_exibicao, ''), split_part(razao_social, ' de ', 2), razao_social),
  status_cliente = CASE
    WHEN status = 'inativo' THEN 'suspensa'::status_entidade_cliente
    ELSE 'ativa'::status_entidade_cliente
  END
WHERE nome_exibicao = '';

ALTER TABLE entidades_contratantes
  ADD CONSTRAINT entidades_contratantes_logo_hue_range CHECK (logo_hue >= 0 AND logo_hue < 360);

CREATE INDEX entidades_contratantes_status_cliente_idx
  ON entidades_contratantes (status_cliente);

CREATE INDEX entidades_contratantes_cnpj_idx
  ON entidades_contratantes (cnpj)
  WHERE char_length(trim(cnpj)) > 0;

CREATE TABLE contratos_entidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  numero TEXT,
  tipo TEXT NOT NULL REFERENCES config_tipos_contrato(id),
  status status_contrato_entidade NOT NULL DEFAULT 'implantacao',
  data_assinatura DATE NOT NULL,
  data_encerramento DATE,
  consultas_contratadas INTEGER,
  consultas_realizadas INTEGER NOT NULL DEFAULT 0,
  percentual_utilizado NUMERIC(5, 2),
  permite_ultrapassar BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contratos_entidade_consultas_nao_negativas CHECK (
    consultas_contratadas IS NULL OR consultas_contratadas >= 0
  ),
  CONSTRAINT contratos_entidade_consultas_realizadas_nao_negativas CHECK (consultas_realizadas >= 0),
  CONSTRAINT contratos_entidade_percentual_range CHECK (
    percentual_utilizado IS NULL
    OR (percentual_utilizado >= 0 AND percentual_utilizado <= 999.99)
  )
);

CREATE INDEX contratos_entidade_entidade_idx ON contratos_entidade (entidade_contratante_id);
CREATE INDEX contratos_entidade_status_idx ON contratos_entidade (status);
CREATE INDEX contratos_entidade_tipo_idx ON contratos_entidade (tipo);

CREATE TRIGGER contratos_entidade_atualizado_em
  BEFORE UPDATE ON contratos_entidade
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE contrato_entidade_especialidades (
  contrato_id UUID NOT NULL REFERENCES contratos_entidade(id) ON DELETE CASCADE,
  especialidade_id TEXT NOT NULL REFERENCES config_especialidades(id) ON DELETE RESTRICT,
  PRIMARY KEY (contrato_id, especialidade_id)
);

CREATE TABLE contrato_entidade_precos_especialidade (
  contrato_id UUID NOT NULL REFERENCES contratos_entidade(id) ON DELETE CASCADE,
  especialidade_id TEXT NOT NULL REFERENCES config_especialidades(id) ON DELETE RESTRICT,
  tipo contrato_preco_tipo NOT NULL,
  valor_consulta_centavos INTEGER NOT NULL,
  PRIMARY KEY (contrato_id, especialidade_id, tipo),
  CONSTRAINT contrato_entidade_precos_valor_positivo CHECK (valor_consulta_centavos > 0)
);

CREATE VIEW vw_admin_clientes_summary AS
SELECT
  COUNT(*)::int AS total_cadastrados,
  COUNT(*) FILTER (WHERE status_cliente = 'ativa')::int AS ativas,
  COUNT(*) FILTER (WHERE status_cliente = 'implantacao')::int AS implantacao,
  COUNT(*) FILTER (WHERE status_cliente = 'prospect')::int AS prospects,
  COUNT(*) FILTER (WHERE status_cliente = 'suspensa')::int AS suspensas,
  COUNT(*) FILTER (WHERE status_cliente = 'sem_contrato')::int AS sem_contrato
FROM entidades_contratantes;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE contratos_entidade TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE contrato_entidade_especialidades TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE contrato_entidade_precos_especialidade TO service_role;
GRANT SELECT ON vw_admin_clientes_summary TO service_role;

ALTER TABLE contratos_entidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrato_entidade_especialidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrato_entidade_precos_especialidade ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE contratos_entidade FROM anon, authenticated;
REVOKE ALL ON TABLE contrato_entidade_especialidades FROM anon, authenticated;
REVOKE ALL ON TABLE contrato_entidade_precos_especialidade FROM anon, authenticated;
