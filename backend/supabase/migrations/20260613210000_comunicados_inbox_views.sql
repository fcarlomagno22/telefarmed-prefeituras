-- Views de inbox e índices auxiliares para listagem de notificações

CREATE INDEX IF NOT EXISTS comunicados_remetente_profissional_idx
  ON public.comunicados (remetente_profissional_id)
  WHERE remetente_profissional_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS comunicados_audiencia_idx
  ON public.comunicados (audiencia);

CREATE OR REPLACE VIEW vw_comunicados_prefeitura_inbox AS
SELECT
  d.id AS destinatario_id,
  c.id AS comunicado_id,
  c.titulo,
  c.corpo,
  c.prioridade,
  c.origem,
  c.audiencia,
  c.entidade_contratante_id,
  c.unidade_ubt_id,
  u.nome AS unidade_nome,
  c.remetente_tipo,
  c.remetente_nome,
  c.especialidade_filtro,
  c.destinatarios_resumo,
  c.enviado_em,
  d.lido_em,
  d.usuario_prefeitura_id
FROM comunicado_destinatarios d
JOIN comunicados c ON c.id = d.comunicado_id
LEFT JOIN unidades_ubt u ON u.id = c.unidade_ubt_id
WHERE d.tipo = 'usuario_prefeitura'
  AND d.usuario_prefeitura_id IS NOT NULL;

CREATE OR REPLACE VIEW vw_comunicados_ubt_inbox AS
SELECT
  d.id AS destinatario_id,
  c.id AS comunicado_id,
  c.titulo,
  c.corpo,
  c.prioridade,
  c.origem,
  c.audiencia,
  c.entidade_contratante_id,
  c.unidade_ubt_id,
  u.nome AS unidade_nome,
  c.remetente_tipo,
  c.remetente_nome,
  c.especialidade_filtro,
  c.destinatarios_resumo,
  c.enviado_em,
  d.lido_em,
  d.usuario_ubt_id
FROM comunicado_destinatarios d
JOIN comunicados c ON c.id = d.comunicado_id
LEFT JOIN unidades_ubt u ON u.id = c.unidade_ubt_id
WHERE d.tipo = 'usuario_ubt'
  AND d.usuario_ubt_id IS NOT NULL;

CREATE OR REPLACE VIEW vw_comunicados_profissional_inbox AS
SELECT
  d.id AS destinatario_id,
  c.id AS comunicado_id,
  c.titulo,
  c.corpo,
  c.prioridade,
  c.origem,
  c.audiencia,
  c.remetente_tipo,
  c.remetente_nome,
  c.especialidade_filtro,
  c.destinatarios_resumo,
  c.enviado_em,
  d.lido_em,
  d.profissional_id
FROM comunicado_destinatarios d
JOIN comunicados c ON c.id = d.comunicado_id
WHERE d.tipo = 'profissional'
  AND d.profissional_id IS NOT NULL;

GRANT SELECT ON vw_comunicados_prefeitura_inbox TO service_role;
GRANT SELECT ON vw_comunicados_ubt_inbox TO service_role;
GRANT SELECT ON vw_comunicados_profissional_inbox TO service_role;
