-- Anexos do chat clínico — path privado no bucket consultas-anexos (URL assinada na leitura).

ALTER TABLE consulta_mensagens
  ADD COLUMN IF NOT EXISTS anexo_storage_path TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS consulta_mensagens_consulta_enviada_idx
  ON consulta_mensagens (consulta_id, enviada_em ASC);
