-- Clínica Geral (médico generalista) não exige RQE na candidatura.

ALTER TABLE candidatura_especialidades
  ALTER COLUMN rqe DROP NOT NULL;

ALTER TABLE candidatura_especialidades
  DROP CONSTRAINT IF EXISTS candidatura_especialidades_rqe_nao_vazio;

ALTER TABLE candidatura_especialidades
  DROP CONSTRAINT IF EXISTS candidatura_especialidades_rqe_formato;

ALTER TABLE candidatura_especialidades
  ADD CONSTRAINT candidatura_especialidades_rqe_formato
  CHECK (rqe IS NULL OR rqe ~ '^[0-9]{3,8}$');

COMMENT ON COLUMN candidatura_especialidades.rqe IS
  'RQE da especialidade. Opcional para Clínica Geral (médico generalista).';
