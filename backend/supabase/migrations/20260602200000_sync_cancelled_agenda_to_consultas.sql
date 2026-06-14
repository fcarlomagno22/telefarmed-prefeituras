-- Cancelamentos na agenda UBT passam a aparecer no histórico operacional (Consultas).
-- Backfill de registros já cancelados antes da sincronização automática.

UPDATE consultas c
SET
  status = 'cancelada',
  cancelada_em = COALESCE(c.cancelada_em, ac.cancelado_em, ac.atualizado_em),
  finalizada_em = COALESCE(c.finalizada_em, ac.cancelado_em, ac.atualizado_em)
FROM agenda_consultas ac
WHERE c.agenda_consulta_id = ac.id
  AND ac.status = 'cancelado'
  AND c.status NOT IN ('cancelada', 'concluida');

INSERT INTO consultas (
  codigo_atendimento,
  entidade_contratante_id,
  unidade_ubt_id,
  paciente_id,
  profissional_id,
  especialidade_id,
  agenda_consulta_id,
  tipo,
  status,
  cancelada_em,
  finalizada_em,
  criado_em
)
SELECT
  'AGD' || replace(ac.id::text, '-', ''),
  ac.entidade_contratante_id,
  ac.unidade_ubt_id,
  ac.paciente_id,
  ac.profissional_id,
  ac.especialidade_id,
  ac.id,
  CASE
    WHEN ac.tipo = 'retorno'::agenda_consulta_tipo THEN 'retorno'::consulta_tipo
    ELSE 'consulta'::consulta_tipo
  END,
  'cancelada'::consulta_status,
  COALESCE(ac.cancelado_em, ac.atualizado_em),
  COALESCE(ac.cancelado_em, ac.atualizado_em),
  (ac.data + ac.hora)::timestamptz
FROM agenda_consultas ac
WHERE ac.status = 'cancelado'::agenda_consulta_status
  AND NOT EXISTS (
    SELECT 1
    FROM consultas c
    WHERE c.agenda_consulta_id = ac.id
  )
ON CONFLICT (codigo_atendimento) DO NOTHING;
