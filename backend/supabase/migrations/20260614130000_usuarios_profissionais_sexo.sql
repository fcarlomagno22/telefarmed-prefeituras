-- Gênero do profissional para alertas de voz na fila do plantão.
DO $$
BEGIN
  CREATE TYPE profissional_sexo AS ENUM ('masculino', 'feminino', 'nao_informado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE usuarios_profissionais
  ADD COLUMN IF NOT EXISTS sexo profissional_sexo NOT NULL DEFAULT 'nao_informado';

COMMENT ON COLUMN usuarios_profissionais.sexo IS
  'Usado em alertas de voz (ex.: fila do plantão). Default nao_informado toca mensagem masculina.';
