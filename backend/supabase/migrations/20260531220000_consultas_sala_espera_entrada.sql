-- Etapa 4.3 — Sala de espera paciente (público)
ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS sala_espera_entrada_em TIMESTAMPTZ;

COMMENT ON COLUMN consultas.sala_espera_entrada_em IS
  'Momento em que o paciente entrou na sala de espera virtual (token público).';
