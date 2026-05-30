-- Catálogo global de exames: categorias e itens
-- Leitura pública via API; mutações somente pelo backend (service_role)

CREATE TABLE config_categorias_exame (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem SMALLINT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT config_categorias_exame_id_formato CHECK (char_length(id) BETWEEN 1 AND 64),
  CONSTRAINT config_categorias_exame_nome_nao_vazio CHECK (char_length(trim(nome)) > 0)
);

CREATE UNIQUE INDEX config_categorias_exame_nome_uidx ON config_categorias_exame (lower(trim(nome)));
CREATE INDEX config_categorias_exame_ativo_ordem_idx ON config_categorias_exame (ativo, ordem, nome);

CREATE TRIGGER config_categorias_exame_atualizado_em
  BEFORE UPDATE ON config_categorias_exame
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE config_exames (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria_id TEXT NOT NULL REFERENCES config_categorias_exame (id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem SMALLINT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT config_exames_id_formato CHECK (char_length(id) BETWEEN 1 AND 64),
  CONSTRAINT config_exames_nome_nao_vazio CHECK (char_length(trim(nome)) > 0)
);

CREATE UNIQUE INDEX config_exames_nome_por_categoria_uidx
  ON config_exames (categoria_id, lower(trim(nome)));
CREATE INDEX config_exames_categoria_ativo_ordem_idx
  ON config_exames (categoria_id, ativo, ordem, nome);

CREATE TRIGGER config_exames_atualizado_em
  BEFORE UPDATE ON config_exames
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

INSERT INTO config_categorias_exame (id, nome, ativo, ordem)
VALUES
  ('exam-cat-0', 'Laboratorial', true, 1),
  ('exam-cat-1', 'Imagem', true, 2),
  ('exam-cat-2', 'Cardiologia', true, 3),
  ('exam-cat-3', 'Outros', true, 4);

INSERT INTO config_exames (id, nome, categoria_id, ativo, ordem)
VALUES
  ('hemograma', 'Hemograma completo', 'exam-cat-0', true, 1),
  ('glicemia', 'Glicemia em jejum', 'exam-cat-0', true, 2),
  ('hba1c', 'Hemoglobina glicada (HbA1c)', 'exam-cat-0', true, 3),
  ('lipidograma', 'Perfil lipídico', 'exam-cat-0', true, 4),
  ('tsh', 'TSH', 'exam-cat-0', true, 5),
  ('t4-livre', 'T4 livre', 'exam-cat-0', true, 6),
  ('urina', 'Urina tipo I', 'exam-cat-0', true, 7),
  ('ureia-creat', 'Ureia e creatinina', 'exam-cat-0', true, 8),
  ('pcr', 'PCR ultrassensível', 'exam-cat-0', true, 9),
  ('rx-torax', 'Radiografia de tórax (PA e perfil)', 'exam-cat-1', true, 1),
  ('us-abdome', 'Ultrassonografia de abdome total', 'exam-cat-1', true, 2),
  ('us-tireoide', 'Ultrassonografia de tireoide', 'exam-cat-1', true, 3),
  ('tc-cranio', 'Tomografia de crânio', 'exam-cat-1', true, 4),
  ('rm-coluna', 'Ressonância magnética de coluna lombar', 'exam-cat-1', true, 5),
  ('ecg', 'Eletrocardiograma (ECG)', 'exam-cat-2', true, 1),
  ('eco', 'Ecocardiograma transtorácico', 'exam-cat-2', true, 2),
  ('espirometria', 'Espirometria', 'exam-cat-3', true, 1),
  ('teste-ergometrico', 'Teste ergométrico', 'exam-cat-3', true, 2);
