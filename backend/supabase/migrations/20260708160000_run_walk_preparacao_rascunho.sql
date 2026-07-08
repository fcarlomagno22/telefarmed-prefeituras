-- Rascunho de preparação Run/Walk (retomada entre dispositivos, TTL 24h no serviço).
-- Escopo: um rascunho por paciente; acesso via backend service_role.

CREATE TABLE run_walk_preparacao_rascunhos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  modality run_walk_modality NOT NULL,
  activity_name TEXT NOT NULL,
  intensity TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 480),
  audio_configured BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT run_walk_preparacao_rascunhos_paciente_unique UNIQUE (paciente_id)
);

CREATE INDEX idx_run_walk_preparacao_rascunhos_expires_at
  ON run_walk_preparacao_rascunhos (expires_at);

REVOKE ALL ON run_walk_preparacao_rascunhos FROM anon, authenticated;
