-- Integrações de saúde do app VD (Apple Health, Health Connect, dispositivos).
-- Estado persistido pelo backend; sem SDK real nesta fase.

CREATE TYPE status_integracao_metrica AS ENUM (
  'connected',
  'disconnected'
);

CREATE TABLE paciente_metricas_integracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  integration_id TEXT NOT NULL,
  status status_integracao_metrica NOT NULL DEFAULT 'disconnected',
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  conectado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT paciente_metricas_integracoes_paciente_integration_uidx
    UNIQUE (paciente_id, integration_id),
  CONSTRAINT paciente_metricas_integracoes_integration_id_chk
    CHECK (integration_id IN ('apple-health', 'health-connect', 'devices')),
  CONSTRAINT paciente_metricas_integracoes_permissions_array_chk
    CHECK (jsonb_typeof(permissions) = 'array'),
  CONSTRAINT paciente_metricas_integracoes_metadata_objeto_chk
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX paciente_metricas_integracoes_paciente_idx
  ON paciente_metricas_integracoes (paciente_id);

CREATE INDEX paciente_metricas_integracoes_entidade_paciente_idx
  ON paciente_metricas_integracoes (entidade_contratante_id, paciente_id);

CREATE TRIGGER paciente_metricas_integracoes_preencher_snapshot
  BEFORE INSERT OR UPDATE OF paciente_id
  ON paciente_metricas_integracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_paciente_metricas_snapshot();

CREATE TRIGGER paciente_metricas_integracoes_definir_atualizado_em
  BEFORE UPDATE ON paciente_metricas_integracoes
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

COMMENT ON TABLE paciente_metricas_integracoes IS
  'Estado das integrações de saúde do app VD por paciente (sem sincronização SDK nesta fase).';

REVOKE ALL ON TABLE paciente_metricas_integracoes FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE paciente_metricas_integracoes TO service_role;
