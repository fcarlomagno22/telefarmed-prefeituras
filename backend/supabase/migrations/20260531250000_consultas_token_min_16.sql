-- Tokens de atendimento: mínimo 16 caracteres (entropia alta no MVP).
-- Atualiza códigos legados (< 16 chars) antes de reforçar o CHECK.

UPDATE consultas
SET codigo_atendimento = codigo_atendimento || substr(
  md5(id::text || codigo_atendimento || random()::text),
  1,
  greatest(0, 16 - char_length(trim(codigo_atendimento)))
)
WHERE char_length(trim(codigo_atendimento)) < 16;

ALTER TABLE consultas DROP CONSTRAINT IF EXISTS consultas_codigo_atendimento_formato;

ALTER TABLE consultas
  ADD CONSTRAINT consultas_codigo_atendimento_formato
  CHECK (char_length(trim(codigo_atendimento)) BETWEEN 16 AND 64);
