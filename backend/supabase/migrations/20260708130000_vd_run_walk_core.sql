-- Corrida e Caminhada (app_cidades / VD) — schema core
-- Escopo de acesso: backend autentica paciente via JWT VD e filtra por paciente_id + entidade_contratante_id.
-- RLS desabilitado nas novas tabelas; acesso exclusivo via service_role no backend.
--
-- Tipos de referência no app:
--   app_cidades/src/data/runWalkActivitySummaryStorage.ts  → RunWalkActivitySummary
--   app_cidades/src/types/runWalkActivityCheckIn.ts        → RunWalkActivityCheckIn
--   app_cidades/src/types/runWalk.ts                       → WeeklyGoalTargets, DispositionCheckinAnswers, TodayActivity
--   app_cidades/src/types/nearbyRunningRoutes.ts             → RunningRouteVote, RunningRouteSpotComment
--   app_cidades/src/data/runWalkSafetyStorage.ts           → TrustedContact
--
-- Decisões de domínio:
--   - Trail GPS: trail_simplified JSONB na atividade; tabela filha run_walk_atividade_pontos reservada para v2.
--   - Delete: soft delete via deleted_at em run_walk_atividades.
--   - Plano do dia: presets estáticos no servidor; personalização leve persistida em run_walk_plano_diario.
--   - Offline-first: client_activity_id UNIQUE por paciente para idempotência de sync.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE run_walk_modality AS ENUM (
  'walk',
  'active-walk',
  'run',
  'run-walk',
  'treadmill',
  'free'
);
-- Alinhado a ActivityModality em app_cidades/src/types/auth.ts

CREATE TYPE run_walk_intensity AS ENUM (
  'light',
  'comfortable',
  'moderate'
);
-- Alinhado a RunWalkIntensity em app_cidades/src/types/runWalk.ts

CREATE TYPE run_walk_activity_type AS ENUM (
  'walk',
  'run-walk',
  'run'
);
-- Alinhado a RunWalkActivityType (plano do dia)

CREATE TYPE run_walk_disposition_mood AS ENUM (
  'great',
  'good',
  'tired',
  'very-tired',
  'discomfort'
);
-- Alinhado a DispositionMood em app_cidades/src/types/runWalk.ts

CREATE TYPE run_walk_disposition_recommendation AS ENUM (
  'keep',
  'slower-pace',
  'reduce-time',
  'swap-walk',
  'light-walk',
  'recovery',
  'rest'
);
-- Alinhado a DispositionRecommendation em app_cidades/src/types/runWalk.ts

CREATE TYPE running_route_spot_vote AS ENUM (
  'recommend',
  'not-recommend'
);
-- Alinhado a RunningRouteVote em app_cidades/src/types/nearbyRunningRoutes.ts

-- ---------------------------------------------------------------------------
-- Atividades completas (sessões finalizadas)
-- ---------------------------------------------------------------------------

CREATE TABLE run_walk_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  client_activity_id TEXT NOT NULL,
  modality run_walk_modality NOT NULL,
  activity_name TEXT NOT NULL,
  elapsed_seconds INTEGER NOT NULL,
  distance_km NUMERIC(10, 3) NOT NULL,
  average_speed_kmh NUMERIC(8, 3),
  pace_min_per_km NUMERIC(8, 3),
  step_count INTEGER NOT NULL DEFAULT 0,
  heart_rate_bpm INTEGER NOT NULL DEFAULT 0,
  estimated_calories INTEGER NOT NULL DEFAULT 0,
  active_minutes INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  trail_simplified JSONB NOT NULL DEFAULT '[]'::jsonb,
  trail_point_count INTEGER NOT NULL DEFAULT 0,
  location_city TEXT,
  location_state TEXT,
  check_in JSONB,
  check_in_skipped BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT run_walk_atividades_client_activity_uidx
    UNIQUE (paciente_id, client_activity_id),
  CONSTRAINT run_walk_atividades_elapsed_seconds_chk
    CHECK (elapsed_seconds >= 0),
  CONSTRAINT run_walk_atividades_distance_km_chk
    CHECK (distance_km >= 0),
  CONSTRAINT run_walk_atividades_active_minutes_chk
    CHECK (active_minutes >= 0),
  CONSTRAINT run_walk_atividades_trail_simplified_array_chk
    CHECK (jsonb_typeof(trail_simplified) = 'array'),
  CONSTRAINT run_walk_atividades_check_in_objeto_chk
    CHECK (check_in IS NULL OR jsonb_typeof(check_in) = 'object'),
  CONSTRAINT run_walk_atividades_trail_point_count_chk
    CHECK (trail_point_count >= 0)
);

COMMENT ON TABLE run_walk_atividades IS
  'Sessões completas de Corrida e Caminhada. Mapeia RunWalkActivitySummary (runWalkActivitySummaryStorage.ts).';

COMMENT ON COLUMN run_walk_atividades.client_activity_id IS
  'UUID gerado no device antes do sync; garante idempotência da fila offline (offline-first).';

COMMENT ON COLUMN run_walk_atividades.trail_simplified IS
  'Polyline simplificada: array de ActivityTrailPoint { latitude, longitude, recordedAt } (runWalkActivityStats.ts).';

COMMENT ON COLUMN run_walk_atividades.trail_point_count IS
  'Quantidade de pontos GPS originais antes da simplificação; útil para stats e futura tabela de pontos.';

COMMENT ON COLUMN run_walk_atividades.check_in IS
  'RunWalkActivityCheckIn: { intensity, wellbeing, discomfort, note, answeredAt } (runWalkActivityCheckIn.ts).';

COMMENT ON COLUMN run_walk_atividades.deleted_at IS
  'Soft delete; listagens e agregações ignoram registros com deleted_at preenchido.';

CREATE INDEX run_walk_atividades_paciente_completed_idx
  ON run_walk_atividades (paciente_id, completed_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX run_walk_atividades_entidade_paciente_idx
  ON run_walk_atividades (entidade_contratante_id, paciente_id);

CREATE INDEX run_walk_atividades_paciente_completed_ativo_idx
  ON run_walk_atividades (paciente_id, completed_at DESC)
  INCLUDE (distance_km, active_minutes, estimated_calories)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Pontos GPS completos (domínio v2 — não utilizado na v1)
-- ---------------------------------------------------------------------------

CREATE TABLE run_walk_atividade_pontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID NOT NULL REFERENCES run_walk_atividades(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_meters DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT run_walk_atividade_pontos_latitude_chk
    CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT run_walk_atividade_pontos_longitude_chk
    CHECK (longitude >= -180 AND longitude <= 180)
);

COMMENT ON TABLE run_walk_atividade_pontos IS
  'Trail GPS completo por atividade. Reservado para v2; v1 persiste apenas trail_simplified em run_walk_atividades.';

CREATE INDEX run_walk_atividade_pontos_atividade_recorded_idx
  ON run_walk_atividade_pontos (atividade_id, recorded_at ASC);

-- ---------------------------------------------------------------------------
-- Metas semanais
-- ---------------------------------------------------------------------------

CREATE TABLE run_walk_metas_semanais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  semana_inicio DATE NOT NULL,
  target_activities INTEGER NOT NULL,
  target_active_minutes INTEGER NOT NULL,
  target_movement_days INTEGER NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT run_walk_metas_semanais_paciente_semana_uidx
    UNIQUE (paciente_id, semana_inicio),
  CONSTRAINT run_walk_metas_semanais_target_activities_chk
    CHECK (target_activities > 0 AND target_activities <= 14),
  CONSTRAINT run_walk_metas_semanais_target_active_minutes_chk
    CHECK (target_active_minutes > 0 AND target_active_minutes <= 600),
  CONSTRAINT run_walk_metas_semanais_target_movement_days_chk
    CHECK (target_movement_days > 0 AND target_movement_days <= 7)
);

COMMENT ON TABLE run_walk_metas_semanais IS
  'Metas semanais do paciente. Mapeia WeeklyGoalTargets (runWalk.ts) por semana (segunda-feira, TZ app).';

COMMENT ON COLUMN run_walk_metas_semanais.semana_inicio IS
  'Data da segunda-feira da semana de referência (YYYY-MM-DD, fuso America/Sao_Paulo).';

CREATE INDEX run_walk_metas_semanais_paciente_semana_idx
  ON run_walk_metas_semanais (paciente_id, semana_inicio DESC);

-- ---------------------------------------------------------------------------
-- Progresso semanal (cache materializado + ajustes manuais)
-- ---------------------------------------------------------------------------

CREATE TABLE run_walk_progresso_semanal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  semana_inicio DATE NOT NULL,
  completed_activities INTEGER NOT NULL DEFAULT 0,
  active_minutes INTEGER NOT NULL DEFAULT 0,
  movement_days INTEGER NOT NULL DEFAULT 0,
  daily_extra_minutes JSONB NOT NULL DEFAULT '{}'::jsonb,
  extra_completed_activities INTEGER NOT NULL DEFAULT 0,
  extra_active_minutes INTEGER NOT NULL DEFAULT 0,
  extra_movement_days INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT run_walk_progresso_semanal_paciente_semana_uidx
    UNIQUE (paciente_id, semana_inicio),
  CONSTRAINT run_walk_progresso_semanal_completed_activities_chk
    CHECK (completed_activities >= 0),
  CONSTRAINT run_walk_progresso_semanal_active_minutes_chk
    CHECK (active_minutes >= 0),
  CONSTRAINT run_walk_progresso_semanal_movement_days_chk
    CHECK (movement_days >= 0 AND movement_days <= 7),
  CONSTRAINT run_walk_progresso_semanal_daily_extra_minutes_objeto_chk
    CHECK (jsonb_typeof(daily_extra_minutes) = 'object'),
  CONSTRAINT run_walk_progresso_semanal_extra_completed_activities_chk
    CHECK (extra_completed_activities >= 0),
  CONSTRAINT run_walk_progresso_semanal_extra_active_minutes_chk
    CHECK (extra_active_minutes >= 0),
  CONSTRAINT run_walk_progresso_semanal_extra_movement_days_chk
    CHECK (extra_movement_days >= 0 AND extra_movement_days <= 7)
);

COMMENT ON TABLE run_walk_progresso_semanal IS
  'Progresso semanal materializado + ajustes extras. Mapeia RunWalkWeeklyProgressRecord (runWalkWeeklyProgressStorage.ts).';

COMMENT ON COLUMN run_walk_progresso_semanal.daily_extra_minutes IS
  'Record<dateIso, minutos> com minutos extras por dia além do calculado pelas atividades.';

CREATE INDEX run_walk_progresso_semanal_paciente_semana_idx
  ON run_walk_progresso_semanal (paciente_id, semana_inicio DESC);

-- ---------------------------------------------------------------------------
-- Check-ins diários de disposição
-- ---------------------------------------------------------------------------

CREATE TABLE run_walk_disposicao_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  checkin_date DATE NOT NULL,
  mood run_walk_disposition_mood NOT NULL,
  slept_well BOOLEAN,
  has_pain BOOLEAN,
  low_energy BOOLEAN,
  prefer_lighter BOOLEAN,
  prefer_walk_over_run BOOLEAN,
  recommendation run_walk_disposition_recommendation,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT run_walk_disposicao_checkins_paciente_data_uidx
    UNIQUE (paciente_id, checkin_date)
);

COMMENT ON TABLE run_walk_disposicao_checkins IS
  'Check-in diário de disposição. Mapeia DispositionCheckinAnswers (runWalk.ts) + recommendation do drawer.';

COMMENT ON COLUMN run_walk_disposicao_checkins.checkin_date IS
  'Dia do check-in (YYYY-MM-DD, fuso America/Sao_Paulo). Um registro por paciente por dia.';

CREATE INDEX run_walk_disposicao_checkins_paciente_data_idx
  ON run_walk_disposicao_checkins (paciente_id, checkin_date DESC);

-- ---------------------------------------------------------------------------
-- Plano / atividade do dia
-- ---------------------------------------------------------------------------

CREATE TABLE run_walk_plano_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  plano_date DATE NOT NULL,
  preset_id TEXT,
  activity_type run_walk_activity_type,
  title TEXT,
  duration_minutes INTEGER,
  intensity run_walk_intensity,
  intensity_label TEXT,
  audio_guidance BOOLEAN NOT NULL DEFAULT false,
  selected_activity JSONB,
  menu_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  skipped BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT run_walk_plano_diario_paciente_data_uidx
    UNIQUE (paciente_id, plano_date),
  CONSTRAINT run_walk_plano_diario_duration_minutes_chk
    CHECK (duration_minutes IS NULL OR (duration_minutes > 0 AND duration_minutes <= 300)),
  CONSTRAINT run_walk_plano_diario_selected_activity_objeto_chk
    CHECK (selected_activity IS NULL OR jsonb_typeof(selected_activity) = 'object'),
  CONSTRAINT run_walk_plano_diario_menu_state_objeto_chk
    CHECK (jsonb_typeof(menu_state) = 'object')
);

COMMENT ON TABLE run_walk_plano_diario IS
  'Plano diário de atividade. Presets estáticos no servidor (TodayActivityPreset); personalização leve por paciente/dia.';

COMMENT ON COLUMN run_walk_plano_diario.preset_id IS
  'TodayActivityPresetId: quick-activity | light-walk | active-walk | recovery-walk | beginner-run-walk | easy-run.';

COMMENT ON COLUMN run_walk_plano_diario.selected_activity IS
  'Snapshot opcional de TodayActivity (runWalk.ts) após personalização.';

COMMENT ON COLUMN run_walk_plano_diario.menu_state IS
  'Estado das ações do menu (ActivityMenuAction): adiar, pular, reduzir intensidade, etc.';

CREATE INDEX run_walk_plano_diario_paciente_data_idx
  ON run_walk_plano_diario (paciente_id, plano_date DESC);

-- ---------------------------------------------------------------------------
-- Contatos de confiança (SOS / live share)
-- ---------------------------------------------------------------------------

CREATE TABLE run_walk_contatos_confianca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  client_contact_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  live_share_enabled BOOLEAN NOT NULL DEFAULT true,
  is_active_sos BOOLEAN NOT NULL DEFAULT false,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT run_walk_contatos_confianca_client_contact_uidx
    UNIQUE (paciente_id, client_contact_id),
  CONSTRAINT run_walk_contatos_confianca_name_len_chk
    CHECK (char_length(trim(name)) >= 2),
  CONSTRAINT run_walk_contatos_confianca_phone_len_chk
    CHECK (char_length(regexp_replace(phone, '\D', '', 'g')) >= 10)
);

COMMENT ON TABLE run_walk_contatos_confianca IS
  'Contatos de confiança para SOS e compartilhamento ao vivo. Mapeia TrustedContact (runWalkSafetyStorage.ts).';

COMMENT ON COLUMN run_walk_contatos_confianca.client_contact_id IS
  'UUID gerado no device para idempotência de sync offline.';

COMMENT ON COLUMN run_walk_contatos_confianca.is_active_sos IS
  'Contato principal exibido no drawer SOS (loadActiveTrustedContact).';

CREATE INDEX run_walk_contatos_confianca_paciente_ativo_idx
  ON run_walk_contatos_confianca (paciente_id, sort_order ASC)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Engajamento em locais para correr (running_route_spots já existe)
-- ---------------------------------------------------------------------------

CREATE TABLE running_route_spot_votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES running_route_spots(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  vote running_route_spot_vote NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT running_route_spot_votos_spot_paciente_uidx
    UNIQUE (spot_id, paciente_id)
);

COMMENT ON TABLE running_route_spot_votos IS
  'Voto do paciente em local para correr. Mapeia RunningRouteVote (nearbyRunningRoutes.ts).';

CREATE INDEX running_route_spot_votos_spot_idx
  ON running_route_spot_votos (spot_id);

CREATE INDEX running_route_spot_votos_paciente_idx
  ON running_route_spot_votos (paciente_id);

CREATE TABLE running_route_spot_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES running_route_spots(id) ON DELETE CASCADE,
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  author_name TEXT NOT NULL,
  text TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT running_route_spot_comentarios_text_len_chk
    CHECK (char_length(trim(text)) >= 1 AND char_length(text) <= 2000)
);

COMMENT ON TABLE running_route_spot_comentarios IS
  'Comentários em locais para correr. Mapeia RunningRouteSpotComment (nearbyRunningRoutes.ts).';

CREATE INDEX running_route_spot_comentarios_spot_criado_idx
  ON running_route_spot_comentarios (spot_id, criado_em DESC)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Triggers: entidade_contratante_id + atualizado_em
-- ---------------------------------------------------------------------------

CREATE TRIGGER run_walk_atividades_preencher_snapshot
  BEFORE INSERT OR UPDATE OF paciente_id
  ON run_walk_atividades
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_paciente_metricas_snapshot();

CREATE TRIGGER run_walk_metas_semanais_preencher_snapshot
  BEFORE INSERT OR UPDATE OF paciente_id
  ON run_walk_metas_semanais
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_paciente_metricas_snapshot();

CREATE TRIGGER run_walk_progresso_semanal_preencher_snapshot
  BEFORE INSERT OR UPDATE OF paciente_id
  ON run_walk_progresso_semanal
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_paciente_metricas_snapshot();

CREATE TRIGGER run_walk_disposicao_checkins_preencher_snapshot
  BEFORE INSERT OR UPDATE OF paciente_id
  ON run_walk_disposicao_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_paciente_metricas_snapshot();

CREATE TRIGGER run_walk_plano_diario_preencher_snapshot
  BEFORE INSERT OR UPDATE OF paciente_id
  ON run_walk_plano_diario
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_paciente_metricas_snapshot();

CREATE TRIGGER run_walk_contatos_confianca_preencher_snapshot
  BEFORE INSERT OR UPDATE OF paciente_id
  ON run_walk_contatos_confianca
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_paciente_metricas_snapshot();

CREATE TRIGGER running_route_spot_votos_preencher_snapshot
  BEFORE INSERT OR UPDATE OF paciente_id
  ON running_route_spot_votos
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_paciente_metricas_snapshot();

CREATE TRIGGER running_route_spot_comentarios_preencher_snapshot
  BEFORE INSERT OR UPDATE OF paciente_id
  ON running_route_spot_comentarios
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_paciente_metricas_snapshot();

CREATE TRIGGER run_walk_atividades_definir_atualizado_em
  BEFORE UPDATE ON run_walk_atividades
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

CREATE TRIGGER run_walk_metas_semanais_definir_atualizado_em
  BEFORE UPDATE ON run_walk_metas_semanais
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

CREATE TRIGGER run_walk_progresso_semanal_definir_atualizado_em
  BEFORE UPDATE ON run_walk_progresso_semanal
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

CREATE TRIGGER run_walk_disposicao_checkins_definir_atualizado_em
  BEFORE UPDATE ON run_walk_disposicao_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

CREATE TRIGGER run_walk_plano_diario_definir_atualizado_em
  BEFORE UPDATE ON run_walk_plano_diario
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

CREATE TRIGGER run_walk_contatos_confianca_definir_atualizado_em
  BEFORE UPDATE ON run_walk_contatos_confianca
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

CREATE TRIGGER running_route_spot_votos_definir_atualizado_em
  BEFORE UPDATE ON running_route_spot_votos
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

CREATE TRIGGER running_route_spot_comentarios_definir_atualizado_em
  BEFORE UPDATE ON running_route_spot_comentarios
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

-- ---------------------------------------------------------------------------
-- Permissões (service_role only)
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE run_walk_atividades FROM anon, authenticated;
REVOKE ALL ON TABLE run_walk_atividade_pontos FROM anon, authenticated;
REVOKE ALL ON TABLE run_walk_metas_semanais FROM anon, authenticated;
REVOKE ALL ON TABLE run_walk_progresso_semanal FROM anon, authenticated;
REVOKE ALL ON TABLE run_walk_disposicao_checkins FROM anon, authenticated;
REVOKE ALL ON TABLE run_walk_plano_diario FROM anon, authenticated;
REVOKE ALL ON TABLE run_walk_contatos_confianca FROM anon, authenticated;
REVOKE ALL ON TABLE running_route_spot_votos FROM anon, authenticated;
REVOKE ALL ON TABLE running_route_spot_comentarios FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE run_walk_atividades TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE run_walk_atividade_pontos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE run_walk_metas_semanais TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE run_walk_progresso_semanal TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE run_walk_disposicao_checkins TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE run_walk_plano_diario TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE run_walk_contatos_confianca TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE running_route_spot_votos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE running_route_spot_comentarios TO service_role;
