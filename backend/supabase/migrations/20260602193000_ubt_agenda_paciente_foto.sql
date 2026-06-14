-- Inclui foto do paciente na view da agenda UBT (lista e drawer).
DROP VIEW IF EXISTS vw_ubt_agenda_consultas;

CREATE VIEW vw_ubt_agenda_consultas AS
SELECT
  c.id,
  c.entidade_contratante_id,
  c.unidade_ubt_id,
  c.paciente_id,
  p.nome AS paciente_nome,
  p.cpf AS paciente_cpf,
  p.telefone AS paciente_telefone,
  c.profissional_id,
  pr.nome AS profissional_nome,
  c.escala_slot_id,
  c.especialidade_id,
  e.nome AS especialidade_nome,
  c.tipo,
  c.origem,
  c.status,
  c.data,
  c.hora,
  c.telefone_contato,
  c.observacoes,
  c.recepcionado_em,
  c.cancelado_em,
  c.criado_em,
  c.atualizado_em,
  p.foto_url AS paciente_foto_url
FROM agenda_consultas c
INNER JOIN pacientes p ON p.id = c.paciente_id
INNER JOIN config_especialidades e ON e.id = c.especialidade_id
LEFT JOIN usuarios_profissionais pr ON pr.id = c.profissional_id;

COMMENT ON VIEW vw_ubt_agenda_consultas IS
  'Consultas da agenda UBT com dados de paciente e especialidade. Filtrar por unidade_ubt_id do JWT.';

REVOKE ALL ON vw_ubt_agenda_consultas FROM anon, authenticated;
GRANT SELECT ON vw_ubt_agenda_consultas TO service_role;
