-- Métricas de saúde do app cidadão (VD / Minhas Métricas)
-- Escopo de acesso: backend autentica paciente via JWT VD e filtra por paciente_id + entidade_contratante_id.
-- RLS desabilitado; acesso exclusivo via service_role no backend.

CREATE TYPE tipo_metrica_paciente AS ENUM (
  'peso',
  'glicemia',
  'pressao',
  'hidratacao',
  'frequencia_cardiaca',
  'medida_corporal',
  'passos',
  'distancia'
);

CREATE TYPE origem_metrica_paciente AS ENUM (
  'manual',
  'integracao',
  'pos_consulta',
  'sistema'
);

CREATE TYPE contexto_glicemia_paciente AS ENUM (
  'fasting',
  'pre_meal',
  'post_meal',
  'bedtime',
  'other'
);

CREATE TYPE medida_corporal_paciente AS ENUM (
  'abdomen',
  'quadril',
  'peito',
  'cintura',
  'coxa',
  'braco',
  'pescoco'
);

CREATE TABLE paciente_metricas_perfil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  altura_metros NUMERIC(4, 2),
  peso_kg NUMERIC(5, 2),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT paciente_metricas_perfil_paciente_uidx UNIQUE (paciente_id),
  CONSTRAINT paciente_metricas_perfil_altura_chk
    CHECK (altura_metros IS NULL OR (altura_metros >= 0.5 AND altura_metros <= 2.5)),
  CONSTRAINT paciente_metricas_perfil_peso_chk
    CHECK (peso_kg IS NULL OR (peso_kg >= 20 AND peso_kg <= 300))
);

CREATE TABLE paciente_metricas_leituras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  tipo tipo_metrica_paciente NOT NULL,
  registrado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  origem origem_metrica_paciente NOT NULL DEFAULT 'manual',
  valor NUMERIC(10, 3) NOT NULL,
  valor_secundario NUMERIC(10, 3),
  contexto_glicemia contexto_glicemia_paciente,
  medida_corporal medida_corporal_paciente,
  metadados JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT paciente_metricas_leituras_valor_positivo_chk CHECK (valor > 0),
  CONSTRAINT paciente_metricas_leituras_glicemia_contexto_chk
    CHECK (tipo <> 'glicemia' OR contexto_glicemia IS NOT NULL),
  CONSTRAINT paciente_metricas_leituras_pressao_valores_chk
    CHECK (
      tipo <> 'pressao'
      OR (
        valor_secundario IS NOT NULL
        AND valor > valor_secundario
        AND valor_secundario > 0
      )
    ),
  CONSTRAINT paciente_metricas_leituras_medida_corporal_chk
    CHECK (tipo <> 'medida_corporal' OR medida_corporal IS NOT NULL),
  CONSTRAINT paciente_metricas_leituras_metadados_objeto_chk
    CHECK (jsonb_typeof(metadados) = 'object')
);

CREATE INDEX paciente_metricas_perfil_entidade_idx
  ON paciente_metricas_perfil (entidade_contratante_id);

CREATE INDEX paciente_metricas_leituras_paciente_registrado_idx
  ON paciente_metricas_leituras (paciente_id, registrado_em DESC);

CREATE INDEX paciente_metricas_leituras_paciente_tipo_registrado_idx
  ON paciente_metricas_leituras (paciente_id, tipo, registrado_em DESC);

CREATE INDEX paciente_metricas_leituras_entidade_paciente_idx
  ON paciente_metricas_leituras (entidade_contratante_id, paciente_id);

CREATE OR REPLACE FUNCTION public.preencher_paciente_metricas_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  pac RECORD;
BEGIN
  SELECT p.entidade_contratante_id
  INTO pac
  FROM pacientes p
  WHERE p.id = NEW.paciente_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paciente não encontrado.';
  END IF;

  NEW.entidade_contratante_id := pac.entidade_contratante_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER paciente_metricas_perfil_preencher_snapshot
  BEFORE INSERT OR UPDATE OF paciente_id
  ON paciente_metricas_perfil
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_paciente_metricas_snapshot();

CREATE TRIGGER paciente_metricas_leituras_preencher_snapshot
  BEFORE INSERT OR UPDATE OF paciente_id
  ON paciente_metricas_leituras
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_paciente_metricas_snapshot();

CREATE TRIGGER paciente_metricas_perfil_definir_atualizado_em
  BEFORE UPDATE ON paciente_metricas_perfil
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

COMMENT ON TABLE paciente_metricas_perfil IS
  'Snapshot antropométrico do paciente no app VD (altura/peso). Um registro por paciente.';

COMMENT ON TABLE paciente_metricas_leituras IS
  'Série temporal de métricas de saúde do app VD. Escopo por paciente autenticado no backend.';

COMMENT ON COLUMN paciente_metricas_leituras.valor IS
  'Valor principal: kg (peso), mg/dL (glicemia), sistólica (pressão), ml (hidratação), bpm (frequência), cm (medida corporal), passos, km (distância).';

COMMENT ON COLUMN paciente_metricas_leituras.valor_secundario IS
  'Valor complementar: diastólica (pressão) ou distância em km quando registrada junto a passos.';

REVOKE ALL ON TABLE paciente_metricas_perfil FROM anon, authenticated;
REVOKE ALL ON TABLE paciente_metricas_leituras FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE paciente_metricas_perfil TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE paciente_metricas_leituras TO service_role;
