-- Hora de Dormir (app_cidades / VD) — schema core
-- Escopo de acesso: backend autentica paciente via JWT VD e filtra por paciente_id + entidade_contratante_id.
-- RLS desabilitado nas novas tabelas; acesso exclusivo via service_role no backend.
--
-- Tipos de referência no app:
--   app_cidades/src/types/sleepLog.ts              → SleepLogEntry, SleepLogDraft, SleepQualityScore
--   app_cidades/src/data/sleepLogStorage.ts        → cache local e fila de sync (offline-first)
--   app_cidades/src/utils/sleepLogFormat.ts        → buildSleepLogEntryFromDraft, formatação
--   app_cidades/src/utils/sleepHistoryStats.ts     → agregações de histórico (computadas no client)
--   app_cidades/src/components/sleepTime/SleepTimeLogDrawer.tsx → formulário de registro
--
-- Decisões de domínio:
--   - Sons, respiração e histórias permanecem no app (bundle); backend persiste apenas registros de sono.
--   - Delete de registros: soft delete via deleted_at (padrão run_walk_atividades / functional_training_sessoes).
--   - Offline-first: client_log_id UNIQUE por paciente para idempotência de sync (SleepLogEntry.id no device).

-- ---------------------------------------------------------------------------
-- Registros de sono
-- ---------------------------------------------------------------------------

CREATE TABLE sleep_time_registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  client_log_id TEXT NOT NULL,
  bed_at TIMESTAMPTZ NOT NULL,
  wake_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  quality SMALLINT NOT NULL,
  wake_count INTEGER NOT NULL,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sleep_time_registros_client_log_uidx
    UNIQUE (paciente_id, client_log_id),
  CONSTRAINT sleep_time_registros_client_log_id_chk
    CHECK (char_length(trim(client_log_id)) >= 8),
  CONSTRAINT sleep_time_registros_duration_minutes_chk
    CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
  CONSTRAINT sleep_time_registros_quality_chk
    CHECK (quality BETWEEN 1 AND 5),
  CONSTRAINT sleep_time_registros_wake_count_chk
    CHECK (wake_count BETWEEN 0 AND 20),
  CONSTRAINT sleep_time_registros_wake_after_bed_chk
    CHECK (wake_at > bed_at),
  CONSTRAINT sleep_time_registros_notes_chk
    CHECK (notes IS NULL OR char_length(notes) <= 500)
);

COMMENT ON TABLE sleep_time_registros IS
  'Registros de sono do paciente (Hora de Dormir). Mapeia SleepLogEntry em app_cidades/src/types/sleepLog.ts.';

COMMENT ON COLUMN sleep_time_registros.client_log_id IS
  'ID gerado no device (SleepLogEntry.id) antes do sync; garante idempotência da fila offline.';

COMMENT ON COLUMN sleep_time_registros.bed_at IS
  'Data/hora em que o paciente foi deitar. Derivado de bedDateIso + bedTimeMinutes no app.';

COMMENT ON COLUMN sleep_time_registros.wake_at IS
  'Data/hora em que o paciente acordou. Derivado de wakeDateIso + wakeTimeMinutes no app.';

COMMENT ON COLUMN sleep_time_registros.duration_minutes IS
  'Duração do sono em minutos; recalculada no backend a partir de bed_at e wake_at.';

COMMENT ON COLUMN sleep_time_registros.quality IS
  'Qualidade percebida do sono (1=muito mal … 5=muito bem). Alinhado a SleepQualityScore.';

COMMENT ON COLUMN sleep_time_registros.wake_count IS
  'Quantidade de despertares durante a noite (0–20).';

COMMENT ON COLUMN sleep_time_registros.deleted_at IS
  'Soft delete; listagens e agregações ignoram registros com deleted_at preenchido.';

CREATE INDEX sleep_time_registros_paciente_wake_idx
  ON sleep_time_registros (paciente_id, wake_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX sleep_time_registros_paciente_deleted_idx
  ON sleep_time_registros (paciente_id, deleted_at);

CREATE INDEX sleep_time_registros_entidade_paciente_idx
  ON sleep_time_registros (entidade_contratante_id, paciente_id);

CREATE INDEX sleep_time_registros_paciente_wake_ativo_idx
  ON sleep_time_registros (paciente_id, wake_at DESC)
  INCLUDE (duration_minutes, quality, wake_count)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Triggers: entidade_contratante_id + atualizado_em
-- ---------------------------------------------------------------------------

CREATE TRIGGER sleep_time_registros_preencher_snapshot
  BEFORE INSERT OR UPDATE OF paciente_id
  ON sleep_time_registros
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_paciente_metricas_snapshot();

CREATE TRIGGER sleep_time_registros_definir_atualizado_em
  BEFORE UPDATE ON sleep_time_registros
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

-- ---------------------------------------------------------------------------
-- Permissões (service_role only)
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE sleep_time_registros FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sleep_time_registros TO service_role;
