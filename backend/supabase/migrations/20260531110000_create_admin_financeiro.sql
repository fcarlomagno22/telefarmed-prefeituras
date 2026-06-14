-- Financeiro admin: fechamentos, contas a pagar, fornecedores, NF e balanço

CREATE TYPE fechamento_competencia_status AS ENUM (
  'aberto',
  'em_apuracao',
  'pre_fechado',
  'fechado',
  'reaberto'
);

CREATE TYPE conta_receber_status_vencimento AS ENUM ('a_vencer', 'paga', 'atrasada');

CREATE TYPE conta_pagar_status AS ENUM ('pendente', 'pago', 'atrasado');

CREATE TYPE conta_pagar_recorrencia AS ENUM ('mensal', 'unica');

CREATE TYPE fornecedor_situacao AS ENUM ('ativa', 'inativa', 'nao_informado');

CREATE TYPE nota_fiscal_fechamento_status AS ENUM ('emitting', 'issued', 'failed');

CREATE TABLE financeiro_centros_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT financeiro_centros_custo_nome_nao_vazio CHECK (char_length(trim(nome)) > 0)
);

CREATE TRIGGER financeiro_centros_custo_atualizado_em
  BEFORE UPDATE ON financeiro_centros_custo
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE financeiro_fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  situacao fornecedor_situacao NOT NULL DEFAULT 'nao_informado',
  contato_email TEXT NOT NULL DEFAULT '',
  contato_telefone TEXT NOT NULL DEFAULT '',
  pessoa_contato TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT financeiro_fornecedores_cnpj_nao_vazio CHECK (char_length(trim(cnpj)) > 0),
  CONSTRAINT financeiro_fornecedores_razao_nao_vazia CHECK (char_length(trim(razao_social)) > 0)
);

CREATE INDEX financeiro_fornecedores_cnpj_idx ON financeiro_fornecedores (cnpj);

CREATE TRIGGER financeiro_fornecedores_atualizado_em
  BEFORE UPDATE ON financeiro_fornecedores
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE financeiro_contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id UUID NOT NULL REFERENCES financeiro_fornecedores(id) ON DELETE RESTRICT,
  descricao TEXT NOT NULL,
  centro_custo_id UUID NOT NULL REFERENCES financeiro_centros_custo(id) ON DELETE RESTRICT,
  recorrencia conta_pagar_recorrencia NOT NULL DEFAULT 'mensal',
  valor_centavos INTEGER NOT NULL,
  vencimento DATE NOT NULL,
  status conta_pagar_status NOT NULL DEFAULT 'pendente',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT financeiro_contas_pagar_descricao_nao_vazia CHECK (char_length(trim(descricao)) > 0),
  CONSTRAINT financeiro_contas_pagar_valor_positivo CHECK (valor_centavos > 0)
);

CREATE INDEX financeiro_contas_pagar_fornecedor_idx ON financeiro_contas_pagar (fornecedor_id);
CREATE INDEX financeiro_contas_pagar_centro_idx ON financeiro_contas_pagar (centro_custo_id);
CREATE INDEX financeiro_contas_pagar_vencimento_idx ON financeiro_contas_pagar (vencimento);
CREATE INDEX financeiro_contas_pagar_status_idx ON financeiro_contas_pagar (status);

CREATE TRIGGER financeiro_contas_pagar_atualizado_em
  BEFORE UPDATE ON financeiro_contas_pagar
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE fechamentos_competencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID NOT NULL REFERENCES contratos_entidade(id) ON DELETE RESTRICT,
  competencia_mes DATE NOT NULL,
  consumo_percentual NUMERIC(5, 2),
  excedeu_limite BOOLEAN NOT NULL DEFAULT false,
  valor_base_centavos INTEGER NOT NULL DEFAULT 0,
  valor_excedente_centavos INTEGER NOT NULL DEFAULT 0,
  ajustes_centavos INTEGER NOT NULL DEFAULT 0,
  valor_final_centavos INTEGER NOT NULL DEFAULT 0,
  status fechamento_competencia_status NOT NULL DEFAULT 'aberto',
  vencimento DATE NOT NULL,
  status_vencimento conta_receber_status_vencimento NOT NULL DEFAULT 'a_vencer',
  fechado_em TIMESTAMPTZ,
  fechado_por_admin_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fechamentos_competencia_unico UNIQUE (contrato_id, competencia_mes),
  CONSTRAINT fechamentos_competencia_valores_nao_negativos CHECK (
    valor_base_centavos >= 0
    AND valor_excedente_centavos >= 0
    AND valor_final_centavos >= 0
  )
);

CREATE INDEX fechamentos_competencia_contrato_idx ON fechamentos_competencia (contrato_id);
CREATE INDEX fechamentos_competencia_mes_idx ON fechamentos_competencia (competencia_mes);
CREATE INDEX fechamentos_competencia_status_idx ON fechamentos_competencia (status);
CREATE INDEX fechamentos_competencia_vencimento_idx ON fechamentos_competencia (vencimento);

CREATE TRIGGER fechamentos_competencia_atualizado_em
  BEFORE UPDATE ON fechamentos_competencia
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE notas_fiscais_fechamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fechamento_id UUID NOT NULL REFERENCES fechamentos_competencia(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  status nota_fiscal_fechamento_status NOT NULL DEFAULT 'emitting',
  emitida_em TIMESTAMPTZ,
  storage_path TEXT,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  tamanho_bytes INTEGER,
  emitida_por_admin_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notas_fiscais_fechamento_unico UNIQUE (fechamento_id)
);

CREATE TRIGGER notas_fiscais_fechamento_atualizado_em
  BEFORE UPDATE ON notas_fiscais_fechamento
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE financeiro_balanco_ajustes_centro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_custo_id UUID NOT NULL REFERENCES financeiro_centros_custo(id) ON DELETE CASCADE,
  valor_ajuste_centavos INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT financeiro_balanco_ajustes_centro_unico UNIQUE (centro_custo_id)
);

CREATE TRIGGER financeiro_balanco_ajustes_atualizado_em
  BEFORE UPDATE ON financeiro_balanco_ajustes_centro
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

INSERT INTO financeiro_centros_custo (nome)
SELECT nome FROM (VALUES
  ('Equipe medica'),
  ('Tecnologia e plataforma'),
  ('Operacao e atendimento'),
  ('Suporte e sucesso do cliente')
) AS seed(nome)
WHERE NOT EXISTS (SELECT 1 FROM financeiro_centros_custo LIMIT 1);

-- Bucket privado para PDFs de NF de fechamento (upload via service_role no backend)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notas-fiscais-fechamento',
  'notas-fiscais-fechamento',
  false,
  5242880,
  ARRAY['application/pdf']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

ALTER TABLE financeiro_centros_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro_contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE fechamentos_competencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_fiscais_fechamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro_balanco_ajustes_centro ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE financeiro_centros_custo FROM anon, authenticated;
REVOKE ALL ON TABLE financeiro_fornecedores FROM anon, authenticated;
REVOKE ALL ON TABLE financeiro_contas_pagar FROM anon, authenticated;
REVOKE ALL ON TABLE fechamentos_competencia FROM anon, authenticated;
REVOKE ALL ON TABLE notas_fiscais_fechamento FROM anon, authenticated;
REVOKE ALL ON TABLE financeiro_balanco_ajustes_centro FROM anon, authenticated;
