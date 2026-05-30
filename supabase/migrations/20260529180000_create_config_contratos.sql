-- Catálogo global de contratos: tipos e regras comerciais
-- Leitura pública via API; mutações somente pelo backend (service_role)

CREATE TABLE config_tipos_contrato (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem SMALLINT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT config_tipos_contrato_id_formato CHECK (char_length(id) BETWEEN 1 AND 64),
  CONSTRAINT config_tipos_contrato_nome_nao_vazio CHECK (char_length(trim(nome)) > 0)
);

CREATE INDEX config_tipos_contrato_ativo_ordem_idx ON config_tipos_contrato (ativo, ordem, nome);
CREATE UNIQUE INDEX config_tipos_contrato_nome_uidx ON config_tipos_contrato (lower(trim(nome)));

CREATE TRIGGER config_tipos_contrato_atualizado_em
  BEFORE UPDATE ON config_tipos_contrato
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE config_regras_comerciais (
  id TEXT PRIMARY KEY DEFAULT 'global',
  permite_ultrapassar_pacote_padrao BOOLEAN NOT NULL DEFAULT true,
  valor_avulso_padrao_brl NUMERIC(10, 2) NOT NULL DEFAULT 47.90,
  min_meses_contrato SMALLINT NOT NULL DEFAULT 12,
  dias_implantacao_padrao SMALLINT NOT NULL DEFAULT 45,
  exige_especialidades_autorizadas BOOLEAN NOT NULL DEFAULT true,
  bloquear_consulta_pacote_esgotado BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT config_regras_comerciais_singleton CHECK (id = 'global'),
  CONSTRAINT config_regras_comerciais_min_meses_positivo CHECK (min_meses_contrato > 0),
  CONSTRAINT config_regras_comerciais_dias_implantacao_positivo CHECK (dias_implantacao_padrao > 0),
  CONSTRAINT config_regras_comerciais_valor_avulso_positivo CHECK (valor_avulso_padrao_brl >= 0)
);

CREATE TRIGGER config_regras_comerciais_atualizado_em
  BEFORE UPDATE ON config_regras_comerciais
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

INSERT INTO config_tipos_contrato (id, nome, descricao, ativo, ordem)
VALUES
  (
    'mensal',
    'Mensal',
    'Franquia mensal de consultas com renovação automática por período.',
    true,
    1
  ),
  (
    'pacote_fechado',
    'Pacote fechado',
    'Volume total de consultas no período do contrato, com controle de utilização.',
    true,
    2
  ),
  (
    'sob_demanda',
    'Sob demanda',
    'Cobrança por consulta realizada, sem pacote pré-contratado.',
    true,
    3
  );

INSERT INTO config_regras_comerciais (
  id,
  permite_ultrapassar_pacote_padrao,
  valor_avulso_padrao_brl,
  min_meses_contrato,
  dias_implantacao_padrao,
  exige_especialidades_autorizadas,
  bloquear_consulta_pacote_esgotado
)
VALUES (
  'global',
  true,
  47.90,
  12,
  45,
  true,
  false
);
