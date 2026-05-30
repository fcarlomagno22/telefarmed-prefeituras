-- Catálogo clínico global: profissões, especialidades e vínculos
-- Leitura pública via API; mutações somente pelo backend (service_role)

CREATE TABLE config_profissoes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  conselho_rotulo TEXT NOT NULL,
  conselho_sigla TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem SMALLINT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT config_profissoes_id_formato CHECK (char_length(id) BETWEEN 1 AND 64),
  CONSTRAINT config_profissoes_nome_nao_vazio CHECK (char_length(trim(nome)) > 0),
  CONSTRAINT config_profissoes_conselho_sigla_nao_vazio CHECK (char_length(trim(conselho_sigla)) > 0)
);

CREATE INDEX config_profissoes_ativo_ordem_idx ON config_profissoes (ativo, ordem, nome);
CREATE UNIQUE INDEX config_profissoes_nome_uidx ON config_profissoes (lower(trim(nome)));

CREATE TABLE config_especialidades (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem SMALLINT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT config_especialidades_id_formato CHECK (char_length(id) BETWEEN 1 AND 64),
  CONSTRAINT config_especialidades_nome_nao_vazio CHECK (char_length(trim(nome)) > 0)
);

CREATE INDEX config_especialidades_ativo_ordem_idx ON config_especialidades (ativo, ordem, nome);
CREATE UNIQUE INDEX config_especialidades_nome_uidx ON config_especialidades (lower(trim(nome)));

CREATE TABLE config_especialidade_profissao (
  especialidade_id TEXT NOT NULL REFERENCES config_especialidades(id) ON DELETE CASCADE,
  profissao_id TEXT NOT NULL REFERENCES config_profissoes(id) ON DELETE CASCADE,
  PRIMARY KEY (especialidade_id, profissao_id)
);

CREATE INDEX config_especialidade_profissao_profissao_idx
  ON config_especialidade_profissao (profissao_id);

CREATE TRIGGER config_profissoes_atualizado_em
  BEFORE UPDATE ON config_profissoes
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TRIGGER config_especialidades_atualizado_em
  BEFORE UPDATE ON config_especialidades
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

-- View agregada para leitura eficiente (uma linha por especialidade)
CREATE VIEW vw_config_especialidades_com_profissoes AS
SELECT
  e.id,
  e.nome,
  e.ativo,
  e.ordem,
  COALESCE(
    array_agg(v.profissao_id ORDER BY v.profissao_id) FILTER (WHERE v.profissao_id IS NOT NULL),
    ARRAY[]::TEXT[]
  ) AS profissao_ids
FROM config_especialidades e
LEFT JOIN config_especialidade_profissao v ON v.especialidade_id = e.id
GROUP BY e.id, e.nome, e.ativo, e.ordem;

-- Persistência atômica do catálogo clínico (PUT admin)
CREATE OR REPLACE FUNCTION salvar_config_clinico(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_profissao JSONB;
  v_especialidade JSONB;
  v_profissao_ids TEXT[] := ARRAY[]::TEXT[];
  v_especialidade_ids TEXT[] := ARRAY[]::TEXT[];
  v_pid TEXT;
BEGIN
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'Payload inválido.' USING ERRCODE = '22023';
  END IF;

  IF NOT (p_payload ? 'professions') OR NOT (p_payload ? 'specialties') THEN
    RAISE EXCEPTION 'Payload deve conter professions e specialties.' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_payload->'professions') <> 'array'
     OR jsonb_typeof(p_payload->'specialties') <> 'array' THEN
    RAISE EXCEPTION 'professions e specialties devem ser arrays.' USING ERRCODE = '22023';
  END IF;

  -- Profissões
  FOR v_profissao IN SELECT * FROM jsonb_array_elements(p_payload->'professions')
  LOOP
    IF coalesce(trim(v_profissao->>'id'), '') = '' THEN
      RAISE EXCEPTION 'Profissão sem id.' USING ERRCODE = '22023';
    END IF;

    v_profissao_ids := array_append(v_profissao_ids, v_profissao->>'id');

    INSERT INTO config_profissoes (id, nome, conselho_rotulo, conselho_sigla, ativo, ordem)
    VALUES (
      v_profissao->>'id',
      trim(v_profissao->>'name'),
      trim(v_profissao->>'councilLabel'),
      trim(v_profissao->>'councilAcronym'),
      coalesce((v_profissao->>'active')::boolean, true),
      coalesce((v_profissao->>'sortOrder')::smallint, 0)
    )
    ON CONFLICT (id) DO UPDATE SET
      nome = EXCLUDED.nome,
      conselho_rotulo = EXCLUDED.conselho_rotulo,
      conselho_sigla = EXCLUDED.conselho_sigla,
      ativo = EXCLUDED.ativo,
      ordem = EXCLUDED.ordem;
  END LOOP;

  -- Especialidades
  FOR v_especialidade IN SELECT * FROM jsonb_array_elements(p_payload->'specialties')
  LOOP
    IF coalesce(trim(v_especialidade->>'id'), '') = '' THEN
      RAISE EXCEPTION 'Especialidade sem id.' USING ERRCODE = '22023';
    END IF;

    v_especialidade_ids := array_append(v_especialidade_ids, v_especialidade->>'id');

    INSERT INTO config_especialidades (id, nome, ativo, ordem)
    VALUES (
      v_especialidade->>'id',
      trim(v_especialidade->>'name'),
      coalesce((v_especialidade->>'active')::boolean, true),
      coalesce((v_especialidade->>'sortOrder')::smallint, 0)
    )
    ON CONFLICT (id) DO UPDATE SET
      nome = EXCLUDED.nome,
      ativo = EXCLUDED.ativo,
      ordem = EXCLUDED.ordem;
  END LOOP;

  -- Remove vínculos obsoletos antes de recriar
  DELETE FROM config_especialidade_profissao
  WHERE especialidade_id = ANY (v_especialidade_ids)
     OR profissao_id = ANY (v_profissao_ids);

  -- Recria vínculos a partir de professionIds (fonte de verdade)
  FOR v_especialidade IN SELECT * FROM jsonb_array_elements(p_payload->'specialties')
  LOOP
    IF jsonb_typeof(v_especialidade->'professionIds') = 'array' THEN
      FOR v_pid IN
        SELECT jsonb_array_elements_text(v_especialidade->'professionIds')
      LOOP
        IF NOT (v_pid = ANY (v_profissao_ids)) THEN
          RAISE EXCEPTION 'Profissão % não encontrada no payload.', v_pid USING ERRCODE = '23503';
        END IF;

        INSERT INTO config_especialidade_profissao (especialidade_id, profissao_id)
        VALUES (v_especialidade->>'id', v_pid)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;

  -- Remove registros ausentes do payload (somente catálogo; sem FK externas ainda)
  DELETE FROM config_especialidades
  WHERE NOT (id = ANY (v_especialidade_ids));

  DELETE FROM config_profissoes
  WHERE NOT (id = ANY (v_profissao_ids));

  RETURN jsonb_build_object('ok', true);
END;
$$;

COMMENT ON FUNCTION salvar_config_clinico IS
  'Upsert atômico de profissões, especialidades e vínculos a partir do payload da API admin.';

-- Seed: profissões e especialidades mockadas da plataforma
INSERT INTO config_profissoes (id, nome, conselho_rotulo, conselho_sigla, ativo, ordem)
VALUES
  ('prof-medicos', 'Médicos', 'Conselho Regional de Medicina', 'CRM', true, 1),
  ('prof-psicologos', 'Psicólogos', 'Conselho Regional de Psicologia', 'CRP', true, 2),
  ('prof-nutricionistas', 'Nutricionistas', 'Conselho Regional de Nutricionistas', 'CRN', true, 3),
  ('prof-fonoaudiologos', 'Fonoaudiólogos', 'Conselho Regional de Fonoaudiologia', 'CRFa', true, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO config_especialidades (id, nome, ativo, ordem)
VALUES
  ('4', 'Clínica Geral', true, 1),
  ('3', 'Pediatria', true, 2),
  ('7', 'Cardiologia', true, 3),
  ('14', 'Dermatologia', true, 4),
  ('15', 'Endocrinologia', false, 5),
  ('113', 'Endocrinologa Pediátrica', false, 6),
  ('16', 'Gastroenterologia', true, 7),
  ('18', 'Geriatria', true, 8),
  ('19', 'Ginecologia', true, 9),
  ('244', 'Ginecologia e Obstetrícia', false, 10),
  ('339', 'Homeopatia', false, 11),
  ('200', 'Homeopatia Pediátrica', false, 12),
  ('179', 'Medicina da Família', true, 13),
  ('26', 'Neurologia', true, 14),
  ('337', 'Nutrologia Adulto', true, 15),
  ('187', 'Nutrologia Pediátrica', false, 16),
  ('34', 'Orientação Nutricional', false, 17),
  ('132', 'Ortopedia e Traumatologia', true, 18),
  ('29', 'Otorrinolaringologia', true, 19),
  ('33', 'Psicologia', true, 20),
  ('331', 'Fonoaudiologia', true, 21),
  ('32', 'Psiquiatria', false, 22),
  ('37', 'Reumatologia', false, 23),
  ('38', 'Urologia', true, 24)
ON CONFLICT (id) DO NOTHING;

INSERT INTO config_especialidade_profissao (especialidade_id, profissao_id)
VALUES
  ('4', 'prof-medicos'),
  ('3', 'prof-medicos'),
  ('7', 'prof-medicos'),
  ('14', 'prof-medicos'),
  ('15', 'prof-medicos'),
  ('113', 'prof-medicos'),
  ('16', 'prof-medicos'),
  ('18', 'prof-medicos'),
  ('19', 'prof-medicos'),
  ('244', 'prof-medicos'),
  ('339', 'prof-medicos'),
  ('200', 'prof-medicos'),
  ('179', 'prof-medicos'),
  ('26', 'prof-medicos'),
  ('337', 'prof-nutricionistas'),
  ('187', 'prof-nutricionistas'),
  ('34', 'prof-nutricionistas'),
  ('132', 'prof-medicos'),
  ('29', 'prof-medicos'),
  ('33', 'prof-psicologos'),
  ('331', 'prof-fonoaudiologos'),
  ('32', 'prof-medicos'),
  ('37', 'prof-medicos'),
  ('38', 'prof-medicos')
ON CONFLICT DO NOTHING;
