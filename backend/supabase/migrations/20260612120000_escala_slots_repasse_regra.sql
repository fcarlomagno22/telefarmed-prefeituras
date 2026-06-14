-- Regra de repasse ao profissional definida na criação do slot de plantão.

ALTER TABLE escala_slots
  ADD COLUMN IF NOT EXISTS repasse_regra JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE escala_slots
  DROP CONSTRAINT IF EXISTS escala_slots_repasse_regra_obj;

ALTER TABLE escala_slots
  ADD CONSTRAINT escala_slots_repasse_regra_obj CHECK (jsonb_typeof(repasse_regra) = 'object');

COMMENT ON COLUMN escala_slots.repasse_regra IS
  'Regra de repasse (modalidade, valores, critérios de presença) definida na montagem da escala.';

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
