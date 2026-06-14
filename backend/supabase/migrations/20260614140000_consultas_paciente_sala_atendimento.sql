-- Marca quando o paciente entra na sala de teleconsulta (após countdown).

ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS paciente_sala_atendimento_entrada_em timestamptz;

COMMENT ON COLUMN consultas.paciente_sala_atendimento_entrada_em IS
  'Preenchido quando o paciente abre a tela de atendimento durante consulta em_andamento.';

DROP VIEW IF EXISTS vw_consultas_operacional;

CREATE VIEW vw_consultas_operacional AS
SELECT
  c.id,
  c.codigo_atendimento,
  c.entidade_contratante_id,
  c.unidade_ubt_id,
  c.paciente_id,
  c.profissional_id,
  c.especialidade_id,
  c.agenda_consulta_id,
  c.fila_espera_id,
  c.tipo,
  c.status,
  c.triagem_resumo,
  c.notas_clinicas,
  c.iniciada_em,
  c.finalizada_em,
  c.duracao_minutos,
  c.cancelada_em,
  c.criado_em,
  c.atualizado_em,
  p.nome AS paciente_nome,
  p.cpf AS paciente_cpf,
  p.sexo AS paciente_sexo,
  p.data_nascimento AS paciente_data_nascimento,
  p.endereco AS paciente_endereco,
  p.foto_url AS paciente_foto_url,
  pr.nome AS profissional_nome,
  pr.especialidade AS profissional_especialidade_texto,
  e.nome AS especialidade_nome,
  ub.nome AS unidade_nome,
  ub.ra_chave AS unidade_regiao_chave,
  ub.ra_rotulo AS unidade_regiao_rotulo,
  c.sala_espera_entrada_em,
  c.paciente_sala_atendimento_entrada_em,
  c.contabilizada_em,
  COALESCE(
    NULLIF(trim(p.endereco ->> 'bairro'), ''),
    NULLIF(trim(p.endereco ->> 'neighborhood'), ''),
    '—'
  ) AS paciente_bairro,
  pr.conselho_sigla AS profissional_conselho_sigla,
  pr.conselho_numero AS profissional_conselho_numero,
  pr.conselho_uf AS profissional_conselho_uf
FROM consultas c
INNER JOIN pacientes p ON p.id = c.paciente_id
INNER JOIN config_especialidades e ON e.id = c.especialidade_id
INNER JOIN unidades_ubt ub ON ub.id = c.unidade_ubt_id
LEFT JOIN usuarios_profissionais pr ON pr.id = c.profissional_id;

COMMENT ON VIEW vw_consultas_operacional IS
  'Consultas clínicas com dados operacionais. Filtrar por escopo do JWT.';

REVOKE ALL ON vw_consultas_operacional FROM anon, authenticated;
GRANT SELECT ON vw_consultas_operacional TO service_role;
