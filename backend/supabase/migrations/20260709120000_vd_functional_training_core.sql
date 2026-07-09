-- Treino Funcional (app_cidades / VD) — schema core
-- Escopo de acesso: backend autentica paciente via JWT VD e filtra por paciente_id + entidade_contratante_id.
-- RLS desabilitado nas novas tabelas; acesso exclusivo via service_role no backend.
--
-- Tipos de referência no app:
--   app_cidades/src/types/functionalTraining.ts           → WorkoutMode, WorkoutSessionRecord, WeeklyTrainingStats
--   app_cidades/src/data/functionalTrainingStorage.ts     → favoritos e histórico (AsyncStorage, migração futura)
--   app_cidades/src/data/functionalExercises.ts           → catálogo estático (20 exercise_id slugs)
--
-- Decisões de domínio:
--   - Catálogo de exercícios permanece no app (Lottie em bundle); backend persiste apenas exercise_id (slug).
--   - Delete de sessões: soft delete via deleted_at (padrão run_walk_atividades).
--   - Offline-first: client_session_id UNIQUE por paciente para idempotência de sync.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE functional_training_modo AS ENUM (
  'single',
  'circuit'
);
-- Alinhado a WorkoutMode em app_cidades/src/types/functionalTraining.ts

-- ---------------------------------------------------------------------------
-- Favoritos por paciente
-- ---------------------------------------------------------------------------

CREATE TABLE functional_training_favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  exercise_id TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT functional_training_favoritos_paciente_exercise_uidx
    UNIQUE (paciente_id, exercise_id),
  CONSTRAINT functional_training_favoritos_exercise_id_chk
    CHECK (char_length(trim(exercise_id)) > 0)
);

COMMENT ON TABLE functional_training_favoritos IS
  'Exercícios favoritos do paciente no Treino Funcional. exercise_id é o slug do catálogo estático no app.';

COMMENT ON COLUMN functional_training_favoritos.exercise_id IS
  'Slug do exercício (ex.: abdominal-reverso). Validado no backend contra allowlist do app.';

CREATE INDEX functional_training_favoritos_paciente_criado_idx
  ON functional_training_favoritos (paciente_id, criado_em DESC);

CREATE INDEX functional_training_favoritos_entidade_paciente_idx
  ON functional_training_favoritos (entidade_contratante_id, paciente_id);

-- ---------------------------------------------------------------------------
-- Sessões concluídas (treinos finalizados)
-- ---------------------------------------------------------------------------

CREATE TABLE functional_training_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  client_session_id TEXT NOT NULL,
  modo functional_training_modo NOT NULL,
  duration_sec INTEGER NOT NULL,
  total_active_sec INTEGER NOT NULL,
  exercise_ids TEXT[] NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT functional_training_sessoes_client_session_uidx
    UNIQUE (paciente_id, client_session_id),
  CONSTRAINT functional_training_sessoes_duration_sec_chk
    CHECK (duration_sec > 0),
  CONSTRAINT functional_training_sessoes_total_active_sec_chk
    CHECK (total_active_sec >= 0),
  CONSTRAINT functional_training_sessoes_exercise_ids_nonempty_chk
    CHECK (cardinality(exercise_ids) >= 1),
  CONSTRAINT functional_training_sessoes_client_session_id_chk
    CHECK (char_length(trim(client_session_id)) > 0)
);

COMMENT ON TABLE functional_training_sessoes IS
  'Sessões completas de Treino Funcional. Mapeia WorkoutSessionRecord (functionalTrainingStorage.ts).';

COMMENT ON COLUMN functional_training_sessoes.client_session_id IS
  'ID gerado no device antes do sync; garante idempotência da fila offline (offline-first).';

COMMENT ON COLUMN functional_training_sessoes.exercise_ids IS
  'Slugs dos exercícios realizados na sessão, na ordem do treino.';

COMMENT ON COLUMN functional_training_sessoes.deleted_at IS
  'Soft delete; listagens e agregações ignoram registros com deleted_at preenchido.';

CREATE INDEX functional_training_sessoes_paciente_completed_idx
  ON functional_training_sessoes (paciente_id, completed_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX functional_training_sessoes_paciente_deleted_idx
  ON functional_training_sessoes (paciente_id, deleted_at);

CREATE INDEX functional_training_sessoes_entidade_paciente_idx
  ON functional_training_sessoes (entidade_contratante_id, paciente_id);

CREATE INDEX functional_training_sessoes_paciente_completed_ativo_idx
  ON functional_training_sessoes (paciente_id, completed_at DESC)
  INCLUDE (total_active_sec, exercise_ids)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

CREATE TRIGGER functional_training_sessoes_definir_atualizado_em
  BEFORE UPDATE ON functional_training_sessoes
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

-- ---------------------------------------------------------------------------
-- Permissões (service_role only)
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE functional_training_favoritos FROM anon, authenticated;
REVOKE ALL ON TABLE functional_training_sessoes FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE functional_training_favoritos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE functional_training_sessoes TO service_role;
