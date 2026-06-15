-- Convites públicos para aceite rápido de plantões abertos (link do e-mail).

CREATE TABLE IF NOT EXISTS escala_slot_convites_aceite (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES escala_slots(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expira_em TIMESTAMPTZ,
  revogado_em TIMESTAMPTZ,
  notificado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS escala_slot_convites_aceite_token_hash_uidx
  ON escala_slot_convites_aceite (token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS escala_slot_convites_aceite_slot_ativo_uidx
  ON escala_slot_convites_aceite (slot_id)
  WHERE revogado_em IS NULL;

CREATE INDEX IF NOT EXISTS escala_slot_convites_aceite_slot_idx
  ON escala_slot_convites_aceite (slot_id);

COMMENT ON TABLE escala_slot_convites_aceite IS
  'Token de aceite público por plantão aberto publicado. Hash SHA-256 do token opaco enviado no e-mail.';
