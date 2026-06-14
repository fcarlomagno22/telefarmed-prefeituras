-- Expõe repasse_regra na view usada pelo portal profissional.

DROP VIEW IF EXISTS vw_profissional_escala_slots_disponiveis;
CREATE VIEW vw_profissional_escala_slots_disponiveis AS
SELECT
  s.id,
  s.data,
  s.hora_inicio,
  s.hora_fim,
  (s.data + s.hora_inicio) AS inicio_em,
  (s.data + s.hora_fim) AS fim_em,
  s.especialidade_id,
  e.nome AS especialidade_nome,
  s.modalidade,
  s.valor_centavos,
  s.repasse_regra,
  s.vagas,
  GREATEST(s.vagas - COALESCE(pc.qtd_confirmados, 0), 0)::INTEGER AS vagas_disponiveis,
  s.unidade_nome,
  s.cidade,
  s.cidade_uf,
  s.endereco_completo,
  s.notas,
  s.escopo_prefeitura,
  s.escopo_ubt,
  s.publicado_em
FROM escala_slots s
INNER JOIN config_especialidades e ON e.id = s.especialidade_id
LEFT JOIN LATERAL (
  SELECT COUNT(*) FILTER (WHERE pc2.status IN ('confirmado', 'realizado')) AS qtd_confirmados
  FROM escala_plantoes_confirmados pc2
  WHERE pc2.slot_id = s.id
) pc ON true
WHERE s.status = 'publicada'
  AND s.modo_atribuicao = 'open'
  AND s.data >= CURRENT_DATE
  AND GREATEST(s.vagas - COALESCE(pc.qtd_confirmados, 0), 0) > 0;

GRANT SELECT ON vw_profissional_escala_slots_disponiveis TO service_role;
