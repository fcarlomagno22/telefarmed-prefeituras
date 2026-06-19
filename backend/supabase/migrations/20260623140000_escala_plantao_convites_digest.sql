-- Convite digest: um link no e-mail lista várias vagas de plantão abertas.

CREATE TABLE IF NOT EXISTS escala_plantao_convites_digest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID REFERENCES usuarios_profissionais(id) ON DELETE SET NULL,
  slot_ids UUID[] NOT NULL,
  token_hash TEXT NOT NULL,
  expira_em TIMESTAMPTZ,
  revogado_em TIMESTAMPTZ,
  notificado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT escala_plantao_convites_digest_slot_ids_nonempty
    CHECK (cardinality(slot_ids) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS escala_plantao_convites_digest_token_hash_uidx
  ON escala_plantao_convites_digest (token_hash);

CREATE INDEX IF NOT EXISTS escala_plantao_convites_digest_profissional_idx
  ON escala_plantao_convites_digest (profissional_id)
  WHERE revogado_em IS NULL;

COMMENT ON TABLE escala_plantao_convites_digest IS
  'Link digest de aceite de plantões: um e-mail por profissional com todas as vagas elegíveis.';
