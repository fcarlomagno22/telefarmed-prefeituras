-- Persistência local de teleconsultas terceirizadas (RH3/Doc24) para agenda UBT e faturamento SUS.

ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS origem_atendimento TEXT NOT NULL DEFAULT 'mp'
    CHECK (origem_atendimento IN ('mp', 'mt')),
  ADD COLUMN IF NOT EXISTS rh3_id_invitacion BIGINT,
  ADD COLUMN IF NOT EXISTS rh3_id_turno BIGINT,
  ADD COLUMN IF NOT EXISTS rh3_deeplink TEXT;

COMMENT ON COLUMN consultas.origem_atendimento IS
  'mp = médico próprio (plantão local); mt = teleconsulta terceirizada RH3/Doc24.';

COMMENT ON COLUMN consultas.rh3_id_invitacion IS
  'Identificador da convite/consulta RH3 (id_invitacion).';

COMMENT ON COLUMN consultas.rh3_id_turno IS
  'Identificador do turno RH3 quando agendado (id_turno).';

COMMENT ON COLUMN consultas.rh3_deeplink IS
  'URL de acesso do paciente à teleconsulta RH3.';

CREATE INDEX IF NOT EXISTS consultas_rh3_id_turno_idx
  ON consultas (rh3_id_turno)
  WHERE rh3_id_turno IS NOT NULL;

CREATE INDEX IF NOT EXISTS consultas_origem_mt_unidade_status_idx
  ON consultas (unidade_ubt_id, status, criado_em DESC)
  WHERE origem_atendimento = 'mt';
