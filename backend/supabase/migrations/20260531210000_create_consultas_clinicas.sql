-- Etapa 4.2 — Domínio clínico de consultas (telemedicina)
-- Escopo multi-tenant: entidade_contratante_id + unidade_ubt_id / profissional_id via JWT.

CREATE TYPE consulta_status AS ENUM (
  'aguardando_medico',
  'em_andamento',
  'concluida',
  'cancelada',
  'interrompida'
);

CREATE TYPE consulta_tipo AS ENUM (
  'consulta',
  'retorno',
  'primeira_consulta'
);

CREATE TYPE consulta_mensagem_remetente AS ENUM (
  'paciente',
  'profissional',
  'sistema'
);

CREATE TYPE consulta_anexo_tipo AS ENUM (
  'receita',
  'pedido_exame',
  'cardapio',
  'plano_alimentar',
  'orientacao',
  'atestado',
  'encaminhamento',
  'outro'
);

CREATE TYPE consulta_anexo_origem AS ENUM (
  'paciente',
  'profissional'
);

CREATE TABLE consultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_atendimento TEXT NOT NULL,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  unidade_ubt_id UUID NOT NULL REFERENCES unidades_ubt(id) ON DELETE RESTRICT,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
  profissional_id UUID REFERENCES usuarios_profissionais(id) ON DELETE SET NULL,
  especialidade_id TEXT NOT NULL REFERENCES config_especialidades(id) ON DELETE RESTRICT,
  agenda_consulta_id UUID REFERENCES agenda_consultas(id) ON DELETE SET NULL,
  fila_espera_id UUID REFERENCES fila_espera(id) ON DELETE SET NULL,
  tipo consulta_tipo NOT NULL DEFAULT 'consulta',
  status consulta_status NOT NULL DEFAULT 'aguardando_medico',
  triagem_resumo TEXT NOT NULL DEFAULT '',
  notas_clinicas TEXT NOT NULL DEFAULT '',
  iniciada_em TIMESTAMPTZ,
  finalizada_em TIMESTAMPTZ,
  duracao_minutos INTEGER,
  cancelada_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consultas_codigo_atendimento_formato CHECK (char_length(trim(codigo_atendimento)) BETWEEN 8 AND 64),
  CONSTRAINT consultas_duracao_nao_negativa CHECK (duracao_minutos IS NULL OR duracao_minutos >= 0)
);

CREATE UNIQUE INDEX consultas_codigo_atendimento_uidx ON consultas (codigo_atendimento);
CREATE INDEX consultas_unidade_status_idx ON consultas (unidade_ubt_id, status, criado_em DESC);
CREATE INDEX consultas_entidade_criado_idx ON consultas (entidade_contratante_id, criado_em DESC);
CREATE INDEX consultas_profissional_finalizada_idx
  ON consultas (profissional_id, finalizada_em DESC)
  WHERE profissional_id IS NOT NULL;
CREATE INDEX consultas_paciente_idx ON consultas (paciente_id);

CREATE TABLE consulta_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id UUID NOT NULL REFERENCES consultas(id) ON DELETE CASCADE,
  remetente_tipo consulta_mensagem_remetente NOT NULL,
  remetente_id UUID,
  conteudo TEXT NOT NULL DEFAULT '',
  anexo_url TEXT NOT NULL DEFAULT '',
  anexo_nome TEXT NOT NULL DEFAULT '',
  enviada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consulta_mensagens_conteudo_ou_anexo CHECK (
    char_length(trim(conteudo)) > 0 OR char_length(trim(anexo_url)) > 0
  )
);

CREATE INDEX consulta_mensagens_consulta_idx ON consulta_mensagens (consulta_id, enviada_em);

CREATE TABLE consulta_prescricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id UUID NOT NULL REFERENCES consultas(id) ON DELETE CASCADE,
  medicamento_nome TEXT NOT NULL,
  dosagem TEXT NOT NULL DEFAULT '',
  via TEXT NOT NULL DEFAULT '',
  frequencia TEXT NOT NULL DEFAULT '',
  duracao TEXT NOT NULL DEFAULT '',
  observacoes TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consulta_prescricoes_medicamento_nao_vazio CHECK (char_length(trim(medicamento_nome)) > 0)
);

CREATE INDEX consulta_prescricoes_consulta_idx ON consulta_prescricoes (consulta_id);

CREATE TABLE consulta_solicitacoes_exame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id UUID NOT NULL REFERENCES consultas(id) ON DELETE CASCADE,
  exame_id TEXT NOT NULL REFERENCES config_exames(id) ON DELETE RESTRICT,
  observacoes TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX consulta_solicitacoes_exame_consulta_idx ON consulta_solicitacoes_exame (consulta_id);

CREATE TABLE consulta_avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id UUID NOT NULL UNIQUE REFERENCES consultas(id) ON DELETE CASCADE,
  nota SMALLINT NOT NULL,
  comentario TEXT NOT NULL DEFAULT '',
  avaliado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consulta_avaliacoes_nota_valida CHECK (nota BETWEEN 1 AND 5)
);

CREATE TABLE consulta_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id UUID NOT NULL REFERENCES consultas(id) ON DELETE CASCADE,
  tipo consulta_anexo_tipo NOT NULL DEFAULT 'outro',
  titulo TEXT NOT NULL,
  arquivo_nome TEXT NOT NULL,
  arquivo_url TEXT NOT NULL DEFAULT '',
  storage_path TEXT NOT NULL DEFAULT '',
  origem consulta_anexo_origem NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consulta_anexos_titulo_nao_vazio CHECK (char_length(trim(titulo)) > 0)
);

CREATE INDEX consulta_anexos_consulta_idx ON consulta_anexos (consulta_id, criado_em);

CREATE TRIGGER consultas_atualizado_em
  BEFORE UPDATE ON consultas
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

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
  ub.ra_rotulo AS unidade_regiao_rotulo
FROM consultas c
INNER JOIN pacientes p ON p.id = c.paciente_id
INNER JOIN config_especialidades e ON e.id = c.especialidade_id
INNER JOIN unidades_ubt ub ON ub.id = c.unidade_ubt_id
LEFT JOIN usuarios_profissionais pr ON pr.id = c.profissional_id;

COMMENT ON VIEW vw_consultas_operacional IS
  'Consultas clínicas com dados operacionais. Filtrar por escopo do JWT.';

ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE consulta_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE consulta_prescricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consulta_solicitacoes_exame ENABLE ROW LEVEL SECURITY;
ALTER TABLE consulta_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consulta_anexos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE consultas FROM anon, authenticated;
REVOKE ALL ON TABLE consulta_mensagens FROM anon, authenticated;
REVOKE ALL ON TABLE consulta_prescricoes FROM anon, authenticated;
REVOKE ALL ON TABLE consulta_solicitacoes_exame FROM anon, authenticated;
REVOKE ALL ON TABLE consulta_avaliacoes FROM anon, authenticated;
REVOKE ALL ON TABLE consulta_anexos FROM anon, authenticated;
REVOKE ALL ON vw_consultas_operacional FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE consultas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE consulta_mensagens TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE consulta_prescricoes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE consulta_solicitacoes_exame TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE consulta_avaliacoes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE consulta_anexos TO service_role;
GRANT SELECT ON vw_consultas_operacional TO service_role;
