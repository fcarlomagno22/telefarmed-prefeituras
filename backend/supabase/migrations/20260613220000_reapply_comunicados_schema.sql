-- Reapply comunicados (idempotente) — tabelas ausentes apesar da migration original registrada

CREATE TABLE IF NOT EXISTS comunicados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  corpo TEXT NOT NULL,
  prioridade prioridade_comunicado NOT NULL DEFAULT 'normal',
  origem origem_comunicado NOT NULL,
  audiencia audiencia_comunicado NOT NULL,
  entidade_contratante_id UUID REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  unidade_ubt_id UUID REFERENCES unidades_ubt(id) ON DELETE SET NULL,
  remetente_tipo remetente_comunicado_tipo NOT NULL,
  remetente_admin_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  remetente_prefeitura_id UUID REFERENCES usuarios_prefeitura(id) ON DELETE SET NULL,
  remetente_ubt_id UUID REFERENCES usuarios_ubt(id) ON DELETE SET NULL,
  remetente_profissional_id UUID REFERENCES usuarios_profissionais(id) ON DELETE SET NULL,
  remetente_nome TEXT NOT NULL DEFAULT '',
  especialidade_filtro TEXT,
  alvos_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  destinatarios_resumo TEXT NOT NULL DEFAULT '',
  total_destinatarios INTEGER NOT NULL DEFAULT 0,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT comunicados_titulo_nao_vazio CHECK (char_length(trim(titulo)) > 0),
  CONSTRAINT comunicados_corpo_nao_vazio CHECK (char_length(trim(corpo)) > 0),
  CONSTRAINT comunicados_total_destinatarios_nao_negativo CHECK (total_destinatarios >= 0)
);

CREATE INDEX IF NOT EXISTS comunicados_enviado_em_idx ON comunicados (enviado_em DESC);
CREATE INDEX IF NOT EXISTS comunicados_entidade_idx ON comunicados (entidade_contratante_id);
CREATE INDEX IF NOT EXISTS comunicados_origem_idx ON comunicados (origem);
CREATE INDEX IF NOT EXISTS comunicados_remetente_admin_idx ON comunicados (remetente_admin_id) WHERE remetente_admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comunicados_remetente_prefeitura_idx ON comunicados (remetente_prefeitura_id) WHERE remetente_prefeitura_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comunicados_remetente_ubt_idx ON comunicados (remetente_ubt_id) WHERE remetente_ubt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comunicados_remetente_profissional_idx ON comunicados (remetente_profissional_id) WHERE remetente_profissional_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comunicados_audiencia_idx ON comunicados (audiencia);

CREATE TABLE IF NOT EXISTS comunicado_destinatarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicado_id UUID NOT NULL REFERENCES comunicados(id) ON DELETE CASCADE,
  tipo destinatario_comunicado_tipo NOT NULL,
  usuario_prefeitura_id UUID REFERENCES usuarios_prefeitura(id) ON DELETE CASCADE,
  usuario_ubt_id UUID REFERENCES usuarios_ubt(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES usuarios_profissionais(id) ON DELETE CASCADE,
  unidade_ubt_id UUID REFERENCES unidades_ubt(id) ON DELETE SET NULL,
  rotulo_destinatario TEXT NOT NULL DEFAULT '',
  lido_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT comunicado_destinatarios_fk_coerente CHECK (
    (tipo = 'usuario_prefeitura' AND usuario_prefeitura_id IS NOT NULL AND usuario_ubt_id IS NULL AND profissional_id IS NULL)
    OR (tipo = 'usuario_ubt' AND usuario_ubt_id IS NOT NULL AND usuario_prefeitura_id IS NULL AND profissional_id IS NULL)
    OR (tipo = 'profissional' AND profissional_id IS NOT NULL AND usuario_prefeitura_id IS NULL AND usuario_ubt_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS comunicado_destinatarios_comunicado_idx ON comunicado_destinatarios (comunicado_id);
CREATE INDEX IF NOT EXISTS comunicado_destinatarios_prefeitura_inbox_idx
  ON comunicado_destinatarios (usuario_prefeitura_id, lido_em)
  WHERE usuario_prefeitura_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comunicado_destinatarios_ubt_inbox_idx
  ON comunicado_destinatarios (usuario_ubt_id, lido_em)
  WHERE usuario_ubt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS comunicado_destinatarios_profissional_inbox_idx
  ON comunicado_destinatarios (profissional_id, lido_em)
  WHERE profissional_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS comunicado_destinatarios_prefeitura_uidx
  ON comunicado_destinatarios (comunicado_id, usuario_prefeitura_id)
  WHERE usuario_prefeitura_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS comunicado_destinatarios_ubt_uidx
  ON comunicado_destinatarios (comunicado_id, usuario_ubt_id)
  WHERE usuario_ubt_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS comunicado_destinatarios_profissional_uidx
  ON comunicado_destinatarios (comunicado_id, profissional_id)
  WHERE profissional_id IS NOT NULL;

ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicado_destinatarios ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE comunicados FROM anon, authenticated;
REVOKE ALL ON TABLE comunicado_destinatarios FROM anon, authenticated;

CREATE OR REPLACE VIEW vw_comunicados_admin_listagem AS
SELECT
  c.id,
  c.titulo,
  c.corpo,
  c.prioridade,
  c.remetente_nome AS remetente_nome,
  c.alvos_snapshot,
  c.destinatarios_resumo,
  c.total_destinatarios,
  c.enviado_em
FROM comunicados c
WHERE c.remetente_tipo = 'admin';

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

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE comunicados TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE comunicado_destinatarios TO service_role;
GRANT SELECT ON vw_comunicados_admin_listagem TO service_role;
GRANT SELECT ON vw_comunicados_prefeitura_inbox TO service_role;
GRANT SELECT ON vw_comunicados_ubt_inbox TO service_role;
GRANT SELECT ON vw_comunicados_profissional_inbox TO service_role;
