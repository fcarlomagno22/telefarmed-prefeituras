-- Fase 6.1 — Live Share: amarrar sessões ao paciente e endurecer RLS.
-- Leitura pública permanece apenas via backend (service_role) em /api/v1/public/live-share/:token.

ALTER TABLE public.run_walk_live_sessions
  ADD COLUMN IF NOT EXISTS paciente_id UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS entidade_contratante_id UUID REFERENCES entidades_contratantes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_cpf TEXT;

COMMENT ON COLUMN public.run_walk_live_sessions.paciente_id IS
  'Paciente dono da sessão. Nullable para sessões legadas criadas antes da Fase 6.';
COMMENT ON COLUMN public.run_walk_live_sessions.entidade_contratante_id IS
  'Escopo do tenant VD. Nullable para retrocompatibilidade com sessões legadas.';
COMMENT ON COLUMN public.run_walk_live_sessions.created_by_cpf IS
  'CPF do usuário autenticado que iniciou o compartilhamento (auditoria).';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'run_walk_live_sessions_created_by_cpf_chk'
  ) THEN
    ALTER TABLE public.run_walk_live_sessions
      ADD CONSTRAINT run_walk_live_sessions_created_by_cpf_chk
      CHECK (
        created_by_cpf IS NULL
        OR length(regexp_replace(created_by_cpf, '\D', '', 'g')) BETWEEN 11 AND 14
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_run_walk_live_sessions_paciente
  ON public.run_walk_live_sessions (paciente_id)
  WHERE paciente_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_run_walk_live_sessions_entidade_paciente
  ON public.run_walk_live_sessions (entidade_contratante_id, paciente_id)
  WHERE paciente_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_run_walk_live_sessions_expires_active
  ON public.run_walk_live_sessions (expires_at)
  WHERE is_active = true;

-- ---------------------------------------------------------------------------
-- Revogar acesso anon (INSERT/UPDATE/SELECT). Viewer usa service_role no backend.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "anon_select_run_walk_live_sessions" ON public.run_walk_live_sessions;
DROP POLICY IF EXISTS "anon_insert_run_walk_live_sessions" ON public.run_walk_live_sessions;
DROP POLICY IF EXISTS "anon_update_run_walk_live_sessions" ON public.run_walk_live_sessions;
DROP POLICY IF EXISTS "anon_select_run_walk_live_points" ON public.run_walk_live_points;
DROP POLICY IF EXISTS "anon_insert_run_walk_live_points" ON public.run_walk_live_points;

REVOKE ALL ON TABLE public.run_walk_live_sessions FROM anon;
REVOKE ALL ON TABLE public.run_walk_live_points FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.run_walk_live_sessions TO service_role;
GRANT SELECT, INSERT, DELETE ON TABLE public.run_walk_live_points TO service_role;

-- ---------------------------------------------------------------------------
-- Limite de pontos por sessão (30s × 12h ≈ 1.440; margem para bursts offline).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.run_walk_enforce_live_point_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_row public.run_walk_live_sessions%ROWTYPE;
  point_count INTEGER;
  max_points CONSTANT INTEGER := 10000;
BEGIN
  SELECT *
  INTO session_row
  FROM public.run_walk_live_sessions
  WHERE id = NEW.session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sessão live share não encontrada.'
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF NOT session_row.is_active OR session_row.expires_at <= now() THEN
    RAISE EXCEPTION 'Sessão live share inativa ou expirada.'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT COUNT(*)
  INTO point_count
  FROM public.run_walk_live_points
  WHERE session_id = NEW.session_id;

  IF point_count >= max_points THEN
    RAISE EXCEPTION 'Limite de pontos GPS por sessão excedido.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_run_walk_live_points_enforce_limits ON public.run_walk_live_points;

CREATE TRIGGER trg_run_walk_live_points_enforce_limits
  BEFORE INSERT ON public.run_walk_live_points
  FOR EACH ROW
  EXECUTE FUNCTION public.run_walk_enforce_live_point_limits();

-- ---------------------------------------------------------------------------
-- Job de expiração: desativa sessões vencidas e remove dados antigos.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.run_walk_expire_live_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deactivated INTEGER;
BEGIN
  UPDATE public.run_walk_live_sessions
  SET is_active = false
  WHERE is_active = true
    AND expires_at <= now();

  GET DIAGNOSTICS deactivated = ROW_COUNT;

  DELETE FROM public.run_walk_live_sessions
  WHERE expires_at < now() - interval '7 days';

  RETURN deactivated;
END;
$$;

COMMENT ON FUNCTION public.run_walk_expire_live_sessions() IS
  'Desativa sessões expiradas e remove registros com mais de 7 dias. Agendado via pg_cron quando disponível.';

DO $schedule$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'run_walk_expire_live_sessions') THEN
      PERFORM cron.unschedule((SELECT jobid FROM cron.job WHERE jobname = 'run_walk_expire_live_sessions' LIMIT 1));
    END IF;

    PERFORM cron.schedule(
      'run_walk_expire_live_sessions',
      '*/15 * * * *',
      $cron$SELECT public.run_walk_expire_live_sessions();$cron$
    );
  END IF;
EXCEPTION
  WHEN undefined_table OR undefined_object OR insufficient_privilege THEN
    RAISE NOTICE 'pg_cron indisponível; agende public.run_walk_expire_live_sessions() manualmente.';
END;
$schedule$;
