-- Cadastro parcial via app cidadão: data de nascimento opcional + origem do cadastro

CREATE TYPE cadastro_origem_paciente AS ENUM ('app', 'ubt', 'admin');

ALTER TABLE pacientes
  ALTER COLUMN data_nascimento DROP NOT NULL;

ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS cadastro_origem cadastro_origem_paciente;

COMMENT ON COLUMN pacientes.data_nascimento IS
  'Opcional no cadastro inicial via app (VD). NULL implica dataQuality incomplete — a UBT deve completar demografia antes do atendimento clínico pleno.';

COMMENT ON COLUMN pacientes.cadastro_origem IS
  'Canal que originou o cadastro: app (VD self-service), ubt (terminal), admin (painel/backoffice).';

DROP VIEW IF EXISTS vw_admin_pacientes_listagem;

CREATE VIEW vw_admin_pacientes_listagem AS
SELECT
  p.id,
  p.cpf,
  p.nome,
  p.nome_social,
  p.data_nascimento,
  p.sexo,
  p.cns,
  p.cns_pendente,
  p.nacionalidade,
  p.raca_cor,
  p.consentimento_cadastro,
  p.telefone,
  p.email,
  p.endereco,
  p.contato_emergencia,
  p.responsavel,
  p.foto_url,
  p.status,
  p.cadastro_origem,
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
