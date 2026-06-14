-- Etapa 4.1 — Fila de espera UBT (triagem)
-- Escopo portal UBT: unidade_ubt_id + entidade_contratante_id fixos pelo JWT.

CREATE TYPE fila_espera_origem AS ENUM (
  'agendado',
  'espontaneo'
);

CREATE TYPE fila_espera_status AS ENUM (
  'aguardando',
  'chamado',
  'em_atendimento',
  'finalizado',
  'desistiu'
);

CREATE TABLE fila_espera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  unidade_ubt_id UUID NOT NULL REFERENCES unidades_ubt(id) ON DELETE RESTRICT,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
  agenda_consulta_id UUID REFERENCES agenda_consultas(id) ON DELETE SET NULL,
  origem fila_espera_origem NOT NULL DEFAULT 'agendado',
  status fila_espera_status NOT NULL DEFAULT 'aguardando',
  prioridade SMALLINT NOT NULL DEFAULT 0,
  chegada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  hora_agendada TIME,
  especialidade_id TEXT NOT NULL REFERENCES config_especialidades(id) ON DELETE RESTRICT,
  especialidade_nome TEXT NOT NULL DEFAULT '',
  telefone_contato TEXT NOT NULL DEFAULT '',
  chamado_em TIMESTAMPTZ,
  atendimento_inicio_em TIMESTAMPTZ,
  encerrado_em TIMESTAMPTZ,
  criado_por_usuario_ubt_id UUID REFERENCES usuarios_ubt(id) ON DELETE SET NULL,
  chamado_por_usuario_ubt_id UUID REFERENCES usuarios_ubt(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX fila_espera_unidade_status_chegada_idx
  ON fila_espera (unidade_ubt_id, status, chegada_em);

CREATE INDEX fila_espera_entidade_idx
  ON fila_espera (entidade_contratante_id);

CREATE INDEX fila_espera_consulta_idx
  ON fila_espera (agenda_consulta_id)
  WHERE agenda_consulta_id IS NOT NULL;

CREATE UNIQUE INDEX fila_espera_consulta_ativa_uidx
  ON fila_espera (agenda_consulta_id)
  WHERE agenda_consulta_id IS NOT NULL
    AND status IN ('aguardando', 'chamado', 'em_atendimento');

CREATE TRIGGER fila_espera_atualizado_em
  BEFORE UPDATE ON fila_espera
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE VIEW vw_ubt_fila_espera AS
SELECT
  f.id,
  f.entidade_contratante_id,
  f.unidade_ubt_id,
  f.paciente_id,
  p.nome AS paciente_nome,
  p.cpf AS paciente_cpf,
  p.telefone AS paciente_telefone,
  f.agenda_consulta_id,
  f.origem,
  f.status,
  f.prioridade,
  f.chegada_em,
  f.hora_agendada,
  f.especialidade_id,
  f.especialidade_nome,
  f.telefone_contato,
  f.chamado_em,
  f.atendimento_inicio_em,
  f.encerrado_em,
  f.criado_em,
  f.atualizado_em
FROM fila_espera f
INNER JOIN pacientes p ON p.id = f.paciente_id;

COMMENT ON VIEW vw_ubt_fila_espera IS
  'Fila de espera UBT com dados de paciente. Filtrar por unidade_ubt_id do JWT.';

ALTER TABLE fila_espera ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE fila_espera FROM anon, authenticated;
REVOKE ALL ON vw_ubt_fila_espera FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE fila_espera TO service_role;
GRANT SELECT ON vw_ubt_fila_espera TO service_role;
