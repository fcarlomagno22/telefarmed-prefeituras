-- Tipos de atestado (afastamento vs comparecimento) e descrição do CID.

ALTER TABLE consulta_atestados
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'afastamento',
  ADD COLUMN IF NOT EXISTS cid_descricao TEXT NOT NULL DEFAULT '';

ALTER TABLE consulta_atestados DROP CONSTRAINT IF EXISTS consulta_atestados_dias_validos;
ALTER TABLE consulta_atestados DROP CONSTRAINT IF EXISTS consulta_atestados_motivo_nao_vazio;

ALTER TABLE consulta_atestados
  ADD CONSTRAINT consulta_atestados_tipo_valido
    CHECK (tipo IN ('afastamento', 'comparecimento'));

ALTER TABLE consulta_atestados
  ADD CONSTRAINT consulta_atestados_dias_validos
    CHECK (
      (tipo = 'comparecimento' AND dias_afastamento = 0)
      OR (tipo = 'afastamento' AND dias_afastamento BETWEEN 1 AND 365)
    );

ALTER TABLE consulta_atestados
  ADD CONSTRAINT consulta_atestados_motivo_check
    CHECK (
      tipo = 'comparecimento'
      OR char_length(trim(motivo)) > 0
    );
