-- Permite vincular um plantão a um ou vários contratos operacionais.

ALTER TABLE escala_slots
  ADD COLUMN IF NOT EXISTS contrato_entidade_ids UUID[] NOT NULL DEFAULT '{}'::UUID[];

ALTER TABLE escala_programacoes
  ADD COLUMN IF NOT EXISTS contrato_entidade_ids UUID[] NOT NULL DEFAULT '{}'::UUID[];

UPDATE escala_slots
SET contrato_entidade_ids = ARRAY[contrato_entidade_id]::UUID[]
WHERE contrato_entidade_id IS NOT NULL
  AND (contrato_entidade_ids IS NULL OR cardinality(contrato_entidade_ids) = 0);

UPDATE escala_programacoes
SET contrato_entidade_ids = ARRAY[contrato_entidade_id]::UUID[]
WHERE contrato_entidade_id IS NOT NULL
  AND (contrato_entidade_ids IS NULL OR cardinality(contrato_entidade_ids) = 0);

CREATE INDEX IF NOT EXISTS escala_slots_contrato_ids_gin_idx
  ON escala_slots USING GIN (contrato_entidade_ids);

CREATE INDEX IF NOT EXISTS escala_programacoes_contrato_ids_gin_idx
  ON escala_programacoes USING GIN (contrato_entidade_ids);

COMMENT ON COLUMN escala_slots.contrato_entidade_ids IS
  'Contratos operacionais que autorizam e faturam consultas deste plantão.';

COMMENT ON COLUMN escala_programacoes.contrato_entidade_ids IS
  'Contratos padrão aplicados aos slots gerados nesta programação.';

DROP VIEW IF EXISTS vw_admin_escala_slots_listagem;

CREATE VIEW vw_admin_escala_slots_listagem AS
SELECT
  s.id,
  s.programacao_id,
  p.titulo AS programacao_titulo,
  s.lote_id,
  s.data,
  s.hora_inicio,
  s.hora_fim,
  (s.data + s.hora_inicio) AS inicio_em,
  (s.data + s.hora_fim) AS fim_em,
  s.especialidade_id,
  e.nome AS especialidade_nome,
  s.modalidade,
  s.modo_atribuicao,
  s.vagas,
  COALESCE(pc.qtd_confirmados, 0)::INTEGER AS vagas_ocupadas,
  GREATEST(s.vagas - COALESCE(pc.qtd_confirmados, 0), 0)::INTEGER AS vagas_disponiveis,
  CASE
    WHEN s.modo_atribuicao = 'assigned' THEN 'na'::TEXT
    WHEN COALESCE(pc.qtd_confirmados, 0) >= s.vagas THEN 'lotado'::TEXT
    WHEN COALESCE(pc.qtd_confirmados, 0) > 0 THEN 'parcial'::TEXT
    ELSE 'aberto'::TEXT
  END AS status_preenchimento,
  s.valor_centavos,
  s.repasse_regra,
  s.status,
  s.profissional_titular_id,
  ut.nome AS profissional_titular_nome,
  s.fila_reserva,
  s.escopo_prefeitura,
  s.escopo_ubt,
  s.contrato_entidade_id,
  s.contrato_entidade_ids,
  s.unidade_nome,
  s.cidade,
  s.cidade_uf,
  s.endereco_completo,
  s.notas,
  COALESCE(ins.qtd_inscricoes, 0)::INTEGER AS qtd_inscricoes,
  COALESCE(ins.qtd_inscricoes_pendentes, 0)::INTEGER AS qtd_inscricoes_pendentes,
  s.publicado_em,
  s.criado_em,
  s.atualizado_em
FROM escala_slots s
INNER JOIN config_especialidades e ON e.id = s.especialidade_id
LEFT JOIN escala_programacoes p ON p.id = s.programacao_id
LEFT JOIN usuarios_profissionais ut ON ut.id = s.profissional_titular_id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) FILTER (WHERE pc2.status IN ('confirmado', 'realizado')) AS qtd_confirmados
  FROM escala_plantoes_confirmados pc2
  WHERE pc2.slot_id = s.id
) pc ON true
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS qtd_inscricoes,
    COUNT(*) FILTER (WHERE i2.status = 'pendente') AS qtd_inscricoes_pendentes
  FROM escala_inscricoes_profissional i2
  WHERE i2.slot_id = s.id
) ins ON true;

GRANT SELECT ON vw_admin_escala_slots_listagem TO service_role;
