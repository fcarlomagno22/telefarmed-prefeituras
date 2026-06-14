-- Reapply UBT agenda + fila (idempotente para ambientes onde migrations não foram aplicadas)
-- Equivalente a 20260531190000 + 20260602193000 + 20260531200000

DO $$ BEGIN
  CREATE TYPE agenda_consulta_tipo AS ENUM ('consulta', 'retorno', 'encaixe');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE agenda_consulta_origem AS ENUM ('agendado', 'espontaneo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE agenda_consulta_status AS ENUM (
    'agendado', 'aguardando', 'em_atendimento', 'realizado', 'faltou', 'cancelado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS agenda_consultas (
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

CREATE INDEX IF NOT EXISTS agenda_consultas_unidade_data_idx ON agenda_consultas (unidade_ubt_id, data);
CREATE INDEX IF NOT EXISTS agenda_consultas_entidade_idx ON agenda_consultas (entidade_contratante_id);
CREATE INDEX IF NOT EXISTS agenda_consultas_paciente_idx ON agenda_consultas (paciente_id);
CREATE INDEX IF NOT EXISTS agenda_consultas_status_idx ON agenda_consultas (status);
CREATE INDEX IF NOT EXISTS agenda_consultas_profissional_data_hora_idx
  ON agenda_consultas (profissional_id, data, hora)
  WHERE status NOT IN ('cancelado', 'faltou');

CREATE TABLE IF NOT EXISTS agenda_bloqueios (
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

CREATE INDEX IF NOT EXISTS agenda_bloqueios_unidade_data_idx ON agenda_bloqueios (unidade_ubt_id, data);
CREATE INDEX IF NOT EXISTS agenda_bloqueios_profissional_data_idx
  ON agenda_bloqueios (profissional_id, data) WHERE profissional_id IS NOT NULL;

DROP TRIGGER IF EXISTS agenda_consultas_atualizado_em ON agenda_consultas;
CREATE TRIGGER agenda_consultas_atualizado_em
  BEFORE UPDATE ON agenda_consultas
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

DROP TRIGGER IF EXISTS agenda_bloqueios_atualizado_em ON agenda_bloqueios;
CREATE TRIGGER agenda_bloqueios_atualizado_em
  BEFORE UPDATE ON agenda_bloqueios
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

DROP VIEW IF EXISTS vw_ubt_agenda_consultas;
CREATE VIEW vw_ubt_agenda_consultas AS
SELECT
  c.id, c.entidade_contratante_id, c.unidade_ubt_id, c.paciente_id,
  p.nome AS paciente_nome, p.cpf AS paciente_cpf, p.telefone AS paciente_telefone,
  c.profissional_id, pr.nome AS profissional_nome, c.escala_slot_id,
  c.especialidade_id, e.nome AS especialidade_nome, c.tipo, c.origem, c.status,
  c.data, c.hora, c.telefone_contato, c.observacoes, c.recepcionado_em, c.cancelado_em,
  c.criado_em, c.atualizado_em, p.foto_url AS paciente_foto_url
FROM agenda_consultas c
INNER JOIN pacientes p ON p.id = c.paciente_id
INNER JOIN config_especialidades e ON e.id = c.especialidade_id
LEFT JOIN usuarios_profissionais pr ON pr.id = c.profissional_id;

DO $$ BEGIN
  CREATE TYPE fila_espera_origem AS ENUM ('agendado', 'espontaneo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fila_espera_status AS ENUM (
    'aguardando', 'chamado', 'em_atendimento', 'finalizado', 'desistiu'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS fila_espera (
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

CREATE INDEX IF NOT EXISTS fila_espera_unidade_status_chegada_idx
  ON fila_espera (unidade_ubt_id, status, chegada_em);
CREATE INDEX IF NOT EXISTS fila_espera_entidade_idx ON fila_espera (entidade_contratante_id);
CREATE INDEX IF NOT EXISTS fila_espera_consulta_idx ON fila_espera (agenda_consulta_id)
  WHERE agenda_consulta_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS fila_espera_consulta_ativa_uidx ON fila_espera (agenda_consulta_id)
  WHERE agenda_consulta_id IS NOT NULL
    AND status IN ('aguardando', 'chamado', 'em_atendimento');

DROP TRIGGER IF EXISTS fila_espera_atualizado_em ON fila_espera;
CREATE TRIGGER fila_espera_atualizado_em
  BEFORE UPDATE ON fila_espera
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

DROP VIEW IF EXISTS vw_ubt_fila_espera;
CREATE VIEW vw_ubt_fila_espera AS
SELECT
  f.id, f.entidade_contratante_id, f.unidade_ubt_id, f.paciente_id,
  p.nome AS paciente_nome, p.cpf AS paciente_cpf, p.telefone AS paciente_telefone,
  f.agenda_consulta_id, f.origem, f.status, f.prioridade, f.chegada_em, f.hora_agendada,
  f.especialidade_id, f.especialidade_nome, f.telefone_contato, f.chamado_em,
  f.atendimento_inicio_em, f.encerrado_em, f.criado_em, f.atualizado_em
FROM fila_espera f
INNER JOIN pacientes p ON p.id = f.paciente_id;

ALTER TABLE agenda_consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_bloqueios ENABLE ROW LEVEL SECURITY;
ALTER TABLE fila_espera ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE agenda_consultas FROM anon, authenticated;
REVOKE ALL ON TABLE agenda_bloqueios FROM anon, authenticated;
REVOKE ALL ON TABLE fila_espera FROM anon, authenticated;
REVOKE ALL ON vw_ubt_agenda_consultas FROM anon, authenticated;
REVOKE ALL ON vw_ubt_fila_espera FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE agenda_consultas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE agenda_bloqueios TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE fila_espera TO service_role;
GRANT SELECT ON vw_ubt_agenda_consultas TO service_role;
GRANT SELECT ON vw_ubt_fila_espera TO service_role;
