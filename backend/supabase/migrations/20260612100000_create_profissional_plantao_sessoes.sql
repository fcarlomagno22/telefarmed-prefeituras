-- Sessões de plantão no portal profissional (agenda / fila).
-- Escopo sempre pelo profissional_id do JWT — nunca confiar em IDs do body.

CREATE TABLE profissional_plantao_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plantao_id UUID NOT NULL REFERENCES escala_plantoes_confirmados(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES usuarios_profissionais(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES escala_slots(id) ON DELETE RESTRICT,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  summary JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX profissional_plantao_sessoes_ativa_uidx
  ON profissional_plantao_sessoes (profissional_id)
  WHERE ended_at IS NULL;

CREATE INDEX profissional_plantao_sessoes_plantao_idx
  ON profissional_plantao_sessoes (plantao_id, entered_at DESC);

CREATE TRIGGER profissional_plantao_sessoes_atualizado_em
  BEFORE UPDATE ON profissional_plantao_sessoes
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

COMMENT ON TABLE profissional_plantao_sessoes IS
  'Sessão ativa ou encerrada de plantão no portal profissional. Uma sessão ativa por profissional.';

ALTER TABLE profissional_plantao_sessoes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE profissional_plantao_sessoes FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE profissional_plantao_sessoes TO service_role;
