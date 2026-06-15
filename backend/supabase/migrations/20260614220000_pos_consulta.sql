-- Acompanhamento pós-consulta: planos, check-ins e respostas (LGPD — dados agregados nos dashboards).

CREATE TYPE pos_consulta_plano_status AS ENUM ('ativo', 'encerrado', 'cancelado');

CREATE TYPE pos_consulta_checkin_status AS ENUM ('pendente', 'enviado', 'respondido', 'expirado');

CREATE TYPE pos_consulta_evolucao AS ENUM ('melhorou', 'igual', 'piorou');

CREATE TABLE pos_consulta_planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id UUID NOT NULL UNIQUE REFERENCES consultas(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
  especialidade_id TEXT NOT NULL REFERENCES config_especialidades(id) ON DELETE RESTRICT,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  profissional_id UUID REFERENCES usuarios_profissionais(id) ON DELETE SET NULL,
  inicio_em TIMESTAMPTZ NOT NULL,
  fim_em TIMESTAMPTZ NOT NULL,
  status pos_consulta_plano_status NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pos_consulta_planos_entidade_idx ON pos_consulta_planos (entidade_contratante_id, status);
CREATE INDEX pos_consulta_planos_paciente_idx ON pos_consulta_planos (paciente_id, especialidade_id);
CREATE INDEX pos_consulta_planos_ativo_idx ON pos_consulta_planos (status, fim_em)
  WHERE status = 'ativo';

CREATE TABLE pos_consulta_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID NOT NULL REFERENCES pos_consulta_planos(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  numero_checkin SMALLINT NOT NULL,
  agendado_para DATE NOT NULL,
  enviado_em TIMESTAMPTZ,
  expira_em TIMESTAMPTZ,
  respondido_em TIMESTAMPTZ,
  status pos_consulta_checkin_status NOT NULL DEFAULT 'pendente',
  reenvios SMALLINT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pos_consulta_checkins_numero_positivo CHECK (numero_checkin > 0),
  CONSTRAINT pos_consulta_checkins_reenvios_nao_negativo CHECK (reenvios >= 0),
  UNIQUE (plano_id, numero_checkin)
);

CREATE INDEX pos_consulta_checkins_plano_idx ON pos_consulta_checkins (plano_id, numero_checkin);
CREATE INDEX pos_consulta_checkins_agendado_idx ON pos_consulta_checkins (agendado_para, status)
  WHERE status IN ('pendente', 'enviado');
CREATE INDEX pos_consulta_checkins_token_idx ON pos_consulta_checkins (token);

CREATE TABLE pos_consulta_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id UUID NOT NULL UNIQUE REFERENCES pos_consulta_checkins(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  evolucao pos_consulta_evolucao,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX pos_consulta_respostas_evolucao_idx ON pos_consulta_respostas (evolucao);

CREATE TRIGGER pos_consulta_planos_atualizado_em
  BEFORE UPDATE ON pos_consulta_planos
  FOR EACH ROW
  EXECUTE FUNCTION definir_atualizado_em();

GRANT ALL ON TABLE pos_consulta_planos TO service_role;
GRANT ALL ON TABLE pos_consulta_checkins TO service_role;
GRANT ALL ON TABLE pos_consulta_respostas TO service_role;
