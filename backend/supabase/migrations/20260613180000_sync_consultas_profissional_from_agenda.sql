-- Sincroniza consultas com o profissional da agenda/fila e corrige registros órfãos.

-- 0) Preenche agenda_consulta_id ausente a partir da fila
UPDATE consultas c
SET agenda_consulta_id = f.agenda_consulta_id
FROM fila_espera f
WHERE c.fila_espera_id = f.id
  AND c.agenda_consulta_id IS NULL
  AND f.agenda_consulta_id IS NOT NULL;

-- 1) Backfill profissional_id e iniciada_em a partir da agenda e fila
UPDATE consultas c
SET
  profissional_id = COALESCE(c.profissional_id, ac.profissional_id),
  iniciada_em = COALESCE(
    c.iniciada_em,
    f.atendimento_inicio_em,
    c.criado_em
  )
FROM fila_espera f
LEFT JOIN agenda_consultas ac ON ac.id = COALESCE(c.agenda_consulta_id, f.agenda_consulta_id)
WHERE c.fila_espera_id = f.id
  AND ac.profissional_id IS NOT NULL
  AND (
    c.profissional_id IS NULL
    OR c.iniciada_em IS NULL
  );

UPDATE consultas c
SET
  profissional_id = COALESCE(c.profissional_id, ac.profissional_id),
  iniciada_em = COALESCE(c.iniciada_em, c.criado_em)
FROM agenda_consultas ac
WHERE c.agenda_consulta_id = ac.id
  AND ac.profissional_id IS NOT NULL
  AND (
    c.profissional_id IS NULL
    OR c.iniciada_em IS NULL
  );

-- 2) Duração quando a consulta já foi finalizada
UPDATE consultas c
SET duracao_minutos = GREATEST(
  1,
  ROUND(
    EXTRACT(EPOCH FROM (c.finalizada_em - COALESCE(c.iniciada_em, c.criado_em))) / 60.0
  )::INTEGER
)
WHERE c.status IN ('concluida', 'interrompida')
  AND c.finalizada_em IS NOT NULL
  AND (c.duracao_minutos IS NULL OR c.duracao_minutos <= 0);

-- 3) Agenda: consultas concluídas → realizado; interrompidas → cancelado
UPDATE agenda_consultas ac
SET status = CASE
  WHEN c.status = 'concluida' THEN 'realizado'::agenda_consulta_status
  WHEN c.status = 'interrompida' THEN 'cancelado'::agenda_consulta_status
  ELSE ac.status
END
FROM consultas c
WHERE c.agenda_consulta_id = ac.id
  AND c.status IN ('concluida', 'interrompida')
  AND ac.status = 'em_atendimento';

-- 4) Fila: consultas concluídas → finalizado
UPDATE fila_espera f
SET
  status = CASE
    WHEN c.status = 'concluida' THEN 'finalizado'::fila_espera_status
    WHEN c.status = 'interrompida' THEN 'desistiu'::fila_espera_status
    ELSE f.status
  END,
  encerrado_em = COALESCE(f.encerrado_em, c.finalizada_em)
FROM consultas c
WHERE c.fila_espera_id = f.id
  AND c.status IN ('concluida', 'interrompida')
  AND f.status = 'em_atendimento';

-- 5) Índice para lookup por agenda + profissional (listagem resiliente)
CREATE INDEX IF NOT EXISTS consultas_agenda_consulta_idx
  ON consultas (agenda_consulta_id)
  WHERE agenda_consulta_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS agenda_consultas_profissional_data_idx
  ON agenda_consultas (profissional_id, data DESC)
  WHERE profissional_id IS NOT NULL;

COMMENT ON INDEX agenda_consultas_profissional_data_idx IS
  'Histórico de atendimentos do profissional via agenda quando consultas.profissional_id estava nulo.';
