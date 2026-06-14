-- Reaplica tabelas/views de escala quando enums existem mas objetos foram removidos.

CREATE TABLE IF NOT EXISTS escala_programacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL DEFAULT '',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  modalidade escala_modalidade NOT NULL DEFAULT 'tele',
  modo_programacao escala_modo_programacao NOT NULL DEFAULT 'fechada',
  escopo_prefeitura JSONB NOT NULL DEFAULT '{"mode":"all","prefeituraIds":[]}'::jsonb,
  escopo_ubt JSONB NOT NULL DEFAULT '{"mode":"all","ubtIds":[]}'::jsonb,
  templates JSONB NOT NULL DEFAULT '[]'::jsonb,
  status status_escala_programacao NOT NULL DEFAULT 'rascunho',
  criado_por_admin_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  contrato_entidade_id UUID REFERENCES contratos_entidade(id) ON DELETE RESTRICT,
  publicado_em TIMESTAMPTZ,
  cancelado_em TIMESTAMPTZ,
  notas TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT escala_programacoes_periodo_valido CHECK (data_fim >= data_inicio),
  CONSTRAINT escala_programacoes_escopo_prefeitura_obj CHECK (jsonb_typeof(escopo_prefeitura) = 'object'),
  CONSTRAINT escala_programacoes_escopo_ubt_obj CHECK (jsonb_typeof(escopo_ubt) = 'object'),
  CONSTRAINT escala_programacoes_templates_array CHECK (jsonb_typeof(templates) = 'array')
);

ALTER TABLE escala_programacoes
  ADD COLUMN IF NOT EXISTS contrato_entidade_id UUID REFERENCES contratos_entidade(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS escala_programacoes_status_idx
  ON escala_programacoes (status, data_inicio DESC);

CREATE INDEX IF NOT EXISTS escala_programacoes_periodo_idx
  ON escala_programacoes (data_inicio, data_fim);

CREATE INDEX IF NOT EXISTS escala_programacoes_criado_por_idx
  ON escala_programacoes (criado_por_admin_id)
  WHERE criado_por_admin_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS escala_programacoes_contrato_idx
  ON escala_programacoes (contrato_entidade_id)
  WHERE contrato_entidade_id IS NOT NULL;

DROP TRIGGER IF EXISTS escala_programacoes_atualizado_em ON escala_programacoes;
CREATE TRIGGER escala_programacoes_atualizado_em
  BEFORE UPDATE ON escala_programacoes
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE IF NOT EXISTS escala_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programacao_id UUID REFERENCES escala_programacoes(id) ON DELETE SET NULL,
  lote_id TEXT,
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  especialidade_id TEXT NOT NULL REFERENCES config_especialidades(id) ON DELETE RESTRICT,
  modalidade escala_modalidade NOT NULL,
  modo_atribuicao escala_modo_atribuicao NOT NULL DEFAULT 'open',
  vagas INTEGER NOT NULL DEFAULT 1,
  valor_centavos INTEGER NOT NULL,
  status status_escala_slot NOT NULL DEFAULT 'rascunho',
  profissional_titular_id UUID REFERENCES usuarios_profissionais(id) ON DELETE SET NULL,
  fila_reserva JSONB NOT NULL DEFAULT '[]'::jsonb,
  escopo_prefeitura JSONB NOT NULL DEFAULT '{"mode":"all","prefeituraIds":[]}'::jsonb,
  escopo_ubt JSONB NOT NULL DEFAULT '{"mode":"all","ubtIds":[]}'::jsonb,
  contrato_entidade_id UUID REFERENCES contratos_entidade(id) ON DELETE RESTRICT,
  unidade_nome TEXT NOT NULL DEFAULT '',
  cidade TEXT NOT NULL DEFAULT '',
  cidade_uf TEXT NOT NULL DEFAULT '',
  endereco_completo TEXT,
  notas TEXT NOT NULL DEFAULT '',
  publicado_em TIMESTAMPTZ,
  cancelado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT escala_slots_horario_valido CHECK (hora_fim > hora_inicio),
  CONSTRAINT escala_slots_vagas_nao_negativas CHECK (vagas >= 0),
  CONSTRAINT escala_slots_valor_positivo CHECK (valor_centavos > 0),
  CONSTRAINT escala_slots_open_com_vagas CHECK (
    modo_atribuicao <> 'open' OR vagas > 0
  ),
  CONSTRAINT escala_slots_fila_reserva_array CHECK (jsonb_typeof(fila_reserva) = 'array'),
  CONSTRAINT escala_slots_escopo_prefeitura_obj CHECK (jsonb_typeof(escopo_prefeitura) = 'object'),
  CONSTRAINT escala_slots_escopo_ubt_obj CHECK (jsonb_typeof(escopo_ubt) = 'object')
);

ALTER TABLE escala_slots
  ADD COLUMN IF NOT EXISTS contrato_entidade_id UUID REFERENCES contratos_entidade(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS escala_slots_data_idx
  ON escala_slots (data, hora_inicio);

CREATE INDEX IF NOT EXISTS escala_slots_especialidade_idx
  ON escala_slots (especialidade_id);

CREATE INDEX IF NOT EXISTS escala_slots_status_publicada_idx
  ON escala_slots (status, data, hora_inicio)
  WHERE status = 'publicada';

CREATE INDEX IF NOT EXISTS escala_slots_programacao_idx
  ON escala_slots (programacao_id)
  WHERE programacao_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS escala_slots_lote_idx
  ON escala_slots (lote_id)
  WHERE lote_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS escala_slots_titular_idx
  ON escala_slots (profissional_titular_id)
  WHERE profissional_titular_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS escala_slots_contrato_idx
  ON escala_slots (contrato_entidade_id)
  WHERE contrato_entidade_id IS NOT NULL;

DROP TRIGGER IF EXISTS escala_slots_atualizado_em ON escala_slots;
CREATE TRIGGER escala_slots_atualizado_em
  BEFORE UPDATE ON escala_slots
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE IF NOT EXISTS escala_inscricoes_profissional (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES escala_slots(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES usuarios_profissionais(id) ON DELETE CASCADE,
  status status_escala_inscricao NOT NULL DEFAULT 'pendente',
  motivo_rejeicao TEXT,
  inscrito_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  respondido_em TIMESTAMPTZ,
  respondido_por_admin_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT escala_inscricoes_slot_profissional_uidx UNIQUE (slot_id, profissional_id)
);

CREATE INDEX IF NOT EXISTS escala_inscricoes_profissional_idx
  ON escala_inscricoes_profissional (profissional_id, status, inscrito_em DESC);

CREATE INDEX IF NOT EXISTS escala_inscricoes_slot_idx
  ON escala_inscricoes_profissional (slot_id, status, inscrito_em);

DROP TRIGGER IF EXISTS escala_inscricoes_profissional_atualizado_em ON escala_inscricoes_profissional;
CREATE TRIGGER escala_inscricoes_profissional_atualizado_em
  BEFORE UPDATE ON escala_inscricoes_profissional
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE IF NOT EXISTS escala_plantoes_confirmados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES escala_slots(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES usuarios_profissionais(id) ON DELETE RESTRICT,
  inscricao_id UUID REFERENCES escala_inscricoes_profissional(id) ON DELETE SET NULL,
  status status_escala_plantao NOT NULL DEFAULT 'confirmado',
  confirmado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmado_por_admin_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  cancelado_em TIMESTAMPTZ,
  motivo_cancelamento TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT escala_plantoes_slot_profissional_uidx UNIQUE (slot_id, profissional_id)
);

CREATE INDEX IF NOT EXISTS escala_plantoes_profissional_idx
  ON escala_plantoes_confirmados (profissional_id, status, confirmado_em DESC);

CREATE INDEX IF NOT EXISTS escala_plantoes_slot_idx
  ON escala_plantoes_confirmados (slot_id, status);

CREATE INDEX IF NOT EXISTS escala_plantoes_ativos_idx
  ON escala_plantoes_confirmados (slot_id)
  WHERE status IN ('confirmado', 'realizado');

DROP TRIGGER IF EXISTS escala_plantoes_confirmados_atualizado_em ON escala_plantoes_confirmados;
CREATE TRIGGER escala_plantoes_confirmados_atualizado_em
  BEFORE UPDATE ON escala_plantoes_confirmados
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

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

ALTER TABLE escala_programacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE escala_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE escala_inscricoes_profissional ENABLE ROW LEVEL SECURITY;
ALTER TABLE escala_plantoes_confirmados ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE escala_programacoes FROM anon, authenticated;
REVOKE ALL ON TABLE escala_slots FROM anon, authenticated;
REVOKE ALL ON TABLE escala_inscricoes_profissional FROM anon, authenticated;
REVOKE ALL ON TABLE escala_plantoes_confirmados FROM anon, authenticated;
REVOKE ALL ON vw_admin_escala_slots_listagem FROM anon, authenticated;
REVOKE ALL ON vw_profissional_escala_slots_disponiveis FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE escala_programacoes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE escala_slots TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE escala_inscricoes_profissional TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE escala_plantoes_confirmados TO service_role;
GRANT SELECT ON vw_admin_escala_slots_listagem TO service_role;
GRANT SELECT ON vw_profissional_escala_slots_disponiveis TO service_role;
