-- Ativa Mente (app_cidades / VD) — schema core
-- Escopo de acesso: backend autentica paciente via JWT VD e filtra por paciente_id + entidade_contratante_id.
-- RLS desabilitado nas novas tabelas; acesso exclusivo via service_role no backend.
--
-- Tipos de referência no app:
--   app_cidades/src/types/activeMind.ts              → ActiveMindGameId, ActiveMindPlayDifficulty
--   app_cidades/src/types/activeMindSession.ts       → ActiveMindSession (futuro sync offline-first)
--   app_cidades/src/config/activeMindGames.ts        → catálogo estático de jogos
--
-- Decisões de domínio:
--   - Puzzles e conteúdo permanecem no app (bundle JSON); backend persiste apenas sessões concluídas.
--   - Delete de sessões: soft delete via deleted_at (padrão functional_training_sessoes / sleep_time_registros).
--   - Offline-first: client_session_id UNIQUE por paciente para idempotência de sync.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE active_mind_game_id AS ENUM (
  'form-the-word',
  'calculations',
  'logic-sequence',
  'sudoku',
  'crosswords',
  'word-search'
);
-- Alinhado a ActiveMindGameId em app_cidades/src/types/activeMind.ts

CREATE TYPE active_mind_difficulty AS ENUM (
  'facil',
  'medio',
  'dificil'
);
-- Alinhado a ActiveMindPlayDifficulty em app_cidades/src/types/activeMind.ts

-- ---------------------------------------------------------------------------
-- Sessões concluídas (jogos finalizados)
-- ---------------------------------------------------------------------------

CREATE TABLE active_mind_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  client_session_id TEXT NOT NULL,
  game_id active_mind_game_id NOT NULL,
  difficulty active_mind_difficulty NOT NULL,
  puzzle_id TEXT,
  duration_sec INTEGER,
  attempts INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  reveals INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT active_mind_sessoes_client_session_uidx
    UNIQUE (paciente_id, client_session_id),
  CONSTRAINT active_mind_sessoes_client_session_id_chk
    CHECK (char_length(trim(client_session_id)) > 0),
  CONSTRAINT active_mind_sessoes_puzzle_id_chk
    CHECK (puzzle_id IS NULL OR char_length(trim(puzzle_id)) > 0),
  CONSTRAINT active_mind_sessoes_duration_sec_chk
    CHECK (duration_sec IS NULL OR duration_sec BETWEEN 1 AND 86400),
  CONSTRAINT active_mind_sessoes_attempts_chk
    CHECK (attempts >= 0),
  CONSTRAINT active_mind_sessoes_correct_chk
    CHECK (correct >= 0),
  CONSTRAINT active_mind_sessoes_errors_chk
    CHECK (errors >= 0),
  CONSTRAINT active_mind_sessoes_reveals_chk
    CHECK (reveals >= 0)
);

COMMENT ON TABLE active_mind_sessoes IS
  'Sessões concluídas de jogos do Ativa Mente. Stats computadas no device ao finalizar partida.';

COMMENT ON COLUMN active_mind_sessoes.client_session_id IS
  'ID gerado no device antes do sync; garante idempotência da fila offline (offline-first).';

COMMENT ON COLUMN active_mind_sessoes.game_id IS
  'Slug do jogo (ex.: sudoku, crosswords). Validado no backend contra allowlist do app.';

COMMENT ON COLUMN active_mind_sessoes.puzzle_id IS
  'Identificador opcional do puzzle no bundle local (ex.: sudoku puzzle id).';

COMMENT ON COLUMN active_mind_sessoes.duration_sec IS
  'Duração da sessão em segundos (1–86400), opcional.';

COMMENT ON COLUMN active_mind_sessoes.deleted_at IS
  'Soft delete; listagens e agregações ignoram registros com deleted_at preenchido.';

CREATE INDEX active_mind_sessoes_paciente_completed_idx
  ON active_mind_sessoes (paciente_id, completed_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX active_mind_sessoes_paciente_deleted_idx
  ON active_mind_sessoes (paciente_id, deleted_at);

CREATE INDEX active_mind_sessoes_entidade_paciente_idx
  ON active_mind_sessoes (entidade_contratante_id, paciente_id);

CREATE INDEX active_mind_sessoes_paciente_completed_ativo_idx
  ON active_mind_sessoes (paciente_id, completed_at DESC)
  INCLUDE (game_id, difficulty, attempts, correct, errors)
  WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

CREATE TRIGGER active_mind_sessoes_definir_atualizado_em
  BEFORE UPDATE ON active_mind_sessoes
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

-- ---------------------------------------------------------------------------
-- Permissões (service_role only)
-- ---------------------------------------------------------------------------

REVOKE ALL ON TABLE active_mind_sessoes FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE active_mind_sessoes TO service_role;
