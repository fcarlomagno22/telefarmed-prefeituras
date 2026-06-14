-- Reaplica schema de pacientes quando tipos existem mas tabelas/view foram perdidas

CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf CHAR(11) NOT NULL,
  nome TEXT NOT NULL,
  nome_social TEXT,
  data_nascimento DATE NOT NULL,
  sexo sexo_paciente NOT NULL DEFAULT 'nao_informado',
  cns TEXT,
  telefone TEXT,
  email TEXT,
  endereco JSONB NOT NULL DEFAULT '{}'::jsonb,
  contato_emergencia JSONB NOT NULL DEFAULT '[]'::jsonb,
  responsavel JSONB,
  foto_url TEXT,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  status status_paciente NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pacientes_cpf_format CHECK (cpf ~ '^[0-9]{11}$'),
  CONSTRAINT pacientes_cpf_entidade_unico UNIQUE (entidade_contratante_id, cpf)
);

CREATE INDEX IF NOT EXISTS pacientes_entidade_idx ON pacientes (entidade_contratante_id);
CREATE INDEX IF NOT EXISTS pacientes_status_idx ON pacientes (status);
CREATE INDEX IF NOT EXISTS pacientes_criado_em_idx ON pacientes (criado_em DESC);

DROP TRIGGER IF EXISTS pacientes_atualizado_em ON pacientes;
CREATE TRIGGER pacientes_atualizado_em
  BEFORE UPDATE ON pacientes
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE IF NOT EXISTS paciente_dependentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titular_paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  dependente_paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  parentesco TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT paciente_dependentes_distintos CHECK (titular_paciente_id <> dependente_paciente_id),
  CONSTRAINT paciente_dependentes_unicos UNIQUE (titular_paciente_id, dependente_paciente_id)
);

CREATE INDEX IF NOT EXISTS paciente_dependentes_titular_idx ON paciente_dependentes (titular_paciente_id);
CREATE INDEX IF NOT EXISTS paciente_dependentes_dependente_idx ON paciente_dependentes (dependente_paciente_id);

CREATE TABLE IF NOT EXISTS paciente_pre_cadastros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf CHAR(11) NOT NULL,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  unidade_ubt_id UUID REFERENCES unidades_ubt(id) ON DELETE SET NULL,
  dados JSONB NOT NULL DEFAULT '{}'::jsonb,
  status status_pre_cadastro_paciente NOT NULL DEFAULT 'pendente',
  admin_usuario_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT paciente_pre_cadastros_cpf_format CHECK (cpf ~ '^[0-9]{11}$')
);

CREATE INDEX IF NOT EXISTS paciente_pre_cadastros_entidade_idx ON paciente_pre_cadastros (entidade_contratante_id);
CREATE INDEX IF NOT EXISTS paciente_pre_cadastros_status_idx ON paciente_pre_cadastros (status);
CREATE INDEX IF NOT EXISTS paciente_pre_cadastros_cpf_idx ON paciente_pre_cadastros (cpf);

DROP TRIGGER IF EXISTS paciente_pre_cadastros_atualizado_em ON paciente_pre_cadastros;
CREATE TRIGGER paciente_pre_cadastros_atualizado_em
  BEFORE UPDATE ON paciente_pre_cadastros
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE IF NOT EXISTS paciente_vinculos_ubt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  unidade_ubt_id UUID NOT NULL REFERENCES unidades_ubt(id) ON DELETE RESTRICT,
  principal BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT paciente_vinculos_ubt_unicos UNIQUE (paciente_id, unidade_ubt_id)
);

CREATE INDEX IF NOT EXISTS paciente_vinculos_ubt_paciente_idx ON paciente_vinculos_ubt (paciente_id);
CREATE INDEX IF NOT EXISTS paciente_vinculos_ubt_unidade_idx ON paciente_vinculos_ubt (unidade_ubt_id);

CREATE OR REPLACE VIEW vw_admin_pacientes_listagem AS
SELECT
  p.id,
  p.cpf,
  p.nome,
  p.nome_social,
  p.data_nascimento,
  p.sexo,
  p.cns,
  p.telefone,
  p.email,
  p.endereco,
  p.contato_emergencia,
  p.responsavel,
  p.foto_url,
  p.status,
  p.criado_em,
  p.atualizado_em,
  p.entidade_contratante_id,
  e.razao_social AS entidade_razao_social,
  e.municipio,
  e.uf,
  EXISTS (
    SELECT 1
    FROM contratos_entidade ce
    WHERE ce.entidade_contratante_id = p.entidade_contratante_id
      AND ce.status = 'ativo'
  ) AS contrato_ativo,
  ub.id AS unidade_ubt_principal_id,
  ub.nome AS unidade_ubt_principal_nome
FROM pacientes p
INNER JOIN entidades_contratantes e ON e.id = p.entidade_contratante_id
LEFT JOIN paciente_vinculos_ubt pv ON pv.paciente_id = p.id AND pv.principal IS TRUE
LEFT JOIN unidades_ubt ub ON ub.id = pv.unidade_ubt_id;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pacientes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE paciente_dependentes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE paciente_pre_cadastros TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE paciente_vinculos_ubt TO service_role;
GRANT SELECT ON vw_admin_pacientes_listagem TO service_role;
