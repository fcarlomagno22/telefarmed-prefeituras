-- Domínio admin de pacientes (base consolidada cross-municipal)

CREATE TYPE status_paciente AS ENUM ('ativo', 'inativo', 'pre_cadastro', 'suspenso');
CREATE TYPE sexo_paciente AS ENUM ('masculino', 'feminino', 'nao_informado');
CREATE TYPE status_pre_cadastro_paciente AS ENUM ('rascunho', 'pendente', 'concluido', 'cancelado');

CREATE TABLE pacientes (
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
  CONSTRAINT pacientes_cpf_unico UNIQUE (cpf)
);

CREATE INDEX pacientes_entidade_idx ON pacientes (entidade_contratante_id);
CREATE INDEX pacientes_status_idx ON pacientes (status);
CREATE INDEX pacientes_criado_em_idx ON pacientes (criado_em DESC);

CREATE TRIGGER pacientes_atualizado_em
  BEFORE UPDATE ON pacientes
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE paciente_dependentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titular_paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  dependente_paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  parentesco TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT paciente_dependentes_distintos CHECK (titular_paciente_id <> dependente_paciente_id),
  CONSTRAINT paciente_dependentes_unicos UNIQUE (titular_paciente_id, dependente_paciente_id)
);

CREATE INDEX paciente_dependentes_titular_idx ON paciente_dependentes (titular_paciente_id);
CREATE INDEX paciente_dependentes_dependente_idx ON paciente_dependentes (dependente_paciente_id);

CREATE TABLE paciente_pre_cadastros (
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

CREATE INDEX paciente_pre_cadastros_entidade_idx ON paciente_pre_cadastros (entidade_contratante_id);
CREATE INDEX paciente_pre_cadastros_status_idx ON paciente_pre_cadastros (status);
CREATE INDEX paciente_pre_cadastros_cpf_idx ON paciente_pre_cadastros (cpf);

CREATE TRIGGER paciente_pre_cadastros_atualizado_em
  BEFORE UPDATE ON paciente_pre_cadastros
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE paciente_vinculos_ubt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  unidade_ubt_id UUID NOT NULL REFERENCES unidades_ubt(id) ON DELETE RESTRICT,
  principal BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT paciente_vinculos_ubt_unicos UNIQUE (paciente_id, unidade_ubt_id)
);

CREATE INDEX paciente_vinculos_ubt_paciente_idx ON paciente_vinculos_ubt (paciente_id);
CREATE INDEX paciente_vinculos_ubt_unidade_idx ON paciente_vinculos_ubt (unidade_ubt_id);

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

-- Pacientes de referência (entidade SJC)
INSERT INTO pacientes (
  id,
  cpf,
  nome,
  data_nascimento,
  sexo,
  telefone,
  email,
  endereco,
  entidade_contratante_id,
  status
)
VALUES
  (
    'c1000000-0000-4000-8000-000000000001',
    '52998224725',
    'Maria Aparecida Silva',
    '1985-03-12',
    'feminino',
    '(12) 99123-4567',
    'maria.silva@email.com',
    '{"bairro":"Centro","cidade":"São José dos Campos","uf":"SP","cep":"12210000"}'::jsonb,
    'a1000000-0000-4000-8000-000000000001',
    'ativo'
  ),
  (
    'c1000000-0000-4000-8000-000000000002',
    '39053344705',
    'João Pedro Santos',
    '1978-07-22',
    'masculino',
    '(12) 99234-5678',
    'joao.santos@email.com',
    '{"bairro":"Vila Nova","cidade":"São José dos Campos","uf":"SP","cep":"12220000"}'::jsonb,
    'a1000000-0000-4000-8000-000000000001',
    'ativo'
  ),
  (
    'c1000000-0000-4000-8000-000000000003',
    '11144477735',
    'Ana Carolina Costa',
    '1992-11-05',
    'feminino',
    '(12) 99345-6789',
    NULL,
    '{"bairro":"Jardim América","cidade":"São José dos Campos","uf":"SP"}'::jsonb,
    'a1000000-0000-4000-8000-000000000001',
    'pre_cadastro'
  )
ON CONFLICT (cpf) DO NOTHING;

INSERT INTO paciente_vinculos_ubt (paciente_id, unidade_ubt_id, principal)
SELECT 'c1000000-0000-4000-8000-000000000001', u.id, true
FROM unidades_ubt u
WHERE u.id = 'b1000000-0000-4000-8000-000000000001'
ON CONFLICT (paciente_id, unidade_ubt_id) DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pacientes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE paciente_dependentes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE paciente_pre_cadastros TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE paciente_vinculos_ubt TO service_role;
GRANT SELECT ON vw_admin_pacientes_listagem TO service_role;
