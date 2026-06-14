-- Etapa 3.4 — Agenda UBT (consultas e bloqueios)
-- Escopo portal UBT: unidade_ubt_id + entidade_contratante_id fixos pelo JWT.
-- Regra de ouro: nunca autorizar por unidade_ubt_id / entidade_contratante_id vindos do body.

CREATE TYPE agenda_consulta_tipo AS ENUM (
  'consulta',
  'retorno',
  'encaixe'
);

CREATE TYPE agenda_consulta_origem AS ENUM (
  'agendado',
  'espontaneo'
);

CREATE TYPE agenda_consulta_status AS ENUM (
  'agendado',
  'aguardando',
  'em_atendimento',
  'realizado',
  'faltou',
  'cancelado'
);

CREATE TABLE agenda_consultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  unidade_ubt_id UUID NOT NULL REFERENCES unidades_ubt(id) ON DELETE RESTRICT,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
  profissional_id UUID REFERENCES usuarios_profissionais(id) ON DELETE SET NULL,
  escala_slot_id UUID REFERENCES escala_slots(id) ON DELETE SET NULL,
  especialidade_id TEXT NOT NULL REFERENCES config_especialidades(id) ON DELETE RESTRICT,
  tipo agenda_consulta_tipo NOT NULL DEFAULT 'consulta',
  origem agenda_consulta_origem NOT NULL DEFAULT 'agendado',
  status agenda_consulta_status NOT NULL DEFAULT 'agendado',
  data DATE NOT NULL,
  hora TIME NOT NULL,
  telefone_contato TEXT NOT NULL DEFAULT '',
  observacoes TEXT NOT NULL DEFAULT '',
  criado_por_usuario_ubt_id UUID REFERENCES usuarios_ubt(id) ON DELETE SET NULL,
  recepcionado_em TIMESTAMPTZ,
  recepcionado_por_usuario_ubt_id UUID REFERENCES usuarios_ubt(id) ON DELETE SET NULL,
  cancelado_em TIMESTAMPTZ,
  cancelado_por_usuario_ubt_id UUID REFERENCES usuarios_ubt(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agenda_consultas_data_hora_valida CHECK (hora IS NOT NULL)
);

CREATE INDEX agenda_consultas_unidade_data_idx
  ON agenda_consultas (unidade_ubt_id, data);

CREATE INDEX agenda_consultas_entidade_idx
  ON agenda_consultas (entidade_contratante_id);

CREATE INDEX agenda_consultas_paciente_idx
  ON agenda_consultas (paciente_id);

CREATE INDEX agenda_consultas_profissional_data_hora_idx
  ON agenda_consultas (profissional_id, data, hora)
  WHERE status NOT IN ('cancelado', 'faltou');

CREATE INDEX agenda_consultas_status_idx
  ON agenda_consultas (status);

CREATE TABLE agenda_bloqueios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  unidade_ubt_id UUID NOT NULL REFERENCES unidades_ubt(id) ON DELETE RESTRICT,
  profissional_id UUID REFERENCES usuarios_profissionais(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  motivo TEXT NOT NULL DEFAULT '',
  criado_por_usuario_ubt_id UUID REFERENCES usuarios_ubt(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agenda_bloqueios_periodo_valido CHECK (hora_fim > hora_inicio)
);

CREATE INDEX agenda_bloqueios_unidade_data_idx
  ON agenda_bloqueios (unidade_ubt_id, data);

CREATE INDEX agenda_bloqueios_profissional_data_idx
  ON agenda_bloqueios (profissional_id, data)
  WHERE profissional_id IS NOT NULL;

CREATE TRIGGER agenda_consultas_atualizado_em
  BEFORE UPDATE ON agenda_consultas
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TRIGGER agenda_bloqueios_atualizado_em
  BEFORE UPDATE ON agenda_bloqueios
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE VIEW vw_ubt_agenda_consultas AS
SELECT
  c.id,
  c.entidade_contratante_id,
  c.unidade_ubt_id,
  c.paciente_id,
  p.nome AS paciente_nome,
  p.cpf AS paciente_cpf,
  p.telefone AS paciente_telefone,
  c.profissional_id,
  pr.nome AS profissional_nome,
  c.escala_slot_id,
  c.especialidade_id,
  e.nome AS especialidade_nome,
  c.tipo,
  c.origem,
  c.status,
  c.data,
  c.hora,
  c.telefone_contato,
  c.observacoes,
  c.recepcionado_em,
  c.cancelado_em,
  c.criado_em,
  c.atualizado_em
FROM agenda_consultas c
INNER JOIN pacientes p ON p.id = c.paciente_id
INNER JOIN config_especialidades e ON e.id = c.especialidade_id
LEFT JOIN usuarios_profissionais pr ON pr.id = c.profissional_id;

COMMENT ON VIEW vw_ubt_agenda_consultas IS
  'Consultas da agenda UBT com dados de paciente e especialidade. Filtrar por unidade_ubt_id do JWT.';

ALTER TABLE agenda_consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_bloqueios ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE agenda_consultas FROM anon, authenticated;
REVOKE ALL ON TABLE agenda_bloqueios FROM anon, authenticated;
REVOKE ALL ON vw_ubt_agenda_consultas FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE agenda_consultas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE agenda_bloqueios TO service_role;
GRANT SELECT ON vw_ubt_agenda_consultas TO service_role;
