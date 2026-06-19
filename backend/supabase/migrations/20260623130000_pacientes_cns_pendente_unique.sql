-- CNS pendente + unicidade por entidade

ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS cns_pendente BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS pacientes_cns_entidade_unico
  ON pacientes (entidade_contratante_id, cns)
  WHERE cns IS NOT NULL AND btrim(cns) <> '';

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
