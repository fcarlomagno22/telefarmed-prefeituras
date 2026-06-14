-- Etapa 9.1 — Fundação financeira do profissional (repasse por competência + dados de pagamento)
-- Repasse será derivado de consultas concluídas (Fase 4) em job futuro; nesta etapa apenas schema.

CREATE TYPE profissional_repasse_status AS ENUM (
  'pendente',
  'processando',
  'pago'
);

CREATE TABLE profissional_dados_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES usuarios_profissionais(id) ON DELETE CASCADE,
  pix_tipo TEXT NOT NULL DEFAULT '',
  pix_chave TEXT NOT NULL DEFAULT '',
  banco_nome TEXT NOT NULL DEFAULT '',
  banco_codigo TEXT NOT NULL DEFAULT '',
  agencia TEXT NOT NULL DEFAULT '',
  conta TEXT NOT NULL DEFAULT '',
  tipo_conta TEXT NOT NULL DEFAULT '',
  titular TEXT NOT NULL DEFAULT '',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profissional_dados_pagamento_profissional_unico UNIQUE (profissional_id)
);

COMMENT ON TABLE profissional_dados_pagamento IS
  'Dados bancários/PIX do profissional para repasse. Uma linha por profissional; escopo portal via JWT sub.';

COMMENT ON COLUMN profissional_dados_pagamento.pix_tipo IS
  'Tipo da chave PIX: cpf, cnpj, email, telefone, aleatoria (alinhado a candidatura/perfil).';

CREATE INDEX profissional_dados_pagamento_profissional_idx
  ON profissional_dados_pagamento (profissional_id);

CREATE TRIGGER profissional_dados_pagamento_definir_atualizado_em
  BEFORE UPDATE ON profissional_dados_pagamento
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TABLE profissional_repasse_competencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES usuarios_profissionais(id) ON DELETE CASCADE,
  competencia TEXT NOT NULL,
  qtd_consultas INTEGER NOT NULL DEFAULT 0,
  valor_centavos INTEGER NOT NULL DEFAULT 0,
  status profissional_repasse_status NOT NULL DEFAULT 'pendente',
  pago_em TIMESTAMPTZ,
  referencia_externa TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profissional_repasse_competencia_unico UNIQUE (profissional_id, competencia),
  CONSTRAINT profissional_repasse_competencia_formato CHECK (
    competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'
  ),
  CONSTRAINT profissional_repasse_qtd_nao_negativa CHECK (qtd_consultas >= 0),
  CONSTRAINT profissional_repasse_valor_nao_negativo CHECK (valor_centavos >= 0)
);

COMMENT ON TABLE profissional_repasse_competencia IS
  'Repasse mensal ao profissional. Gerado por job futuro a partir de consultas.status = concluida (Fase 4).';

COMMENT ON COLUMN profissional_repasse_competencia.competencia IS
  'Competência no formato YYYY-MM (mês civil das consultas contabilizadas).';

COMMENT ON COLUMN profissional_repasse_competencia.referencia_externa IS
  'ID de pagamento externo (PIX/TED) após liquidação; opcional.';

CREATE INDEX profissional_repasse_profissional_idx
  ON profissional_repasse_competencia (profissional_id, competencia DESC);

CREATE INDEX profissional_repasse_status_idx
  ON profissional_repasse_competencia (status, competencia DESC);

CREATE TRIGGER profissional_repasse_competencia_definir_atualizado_em
  BEFORE UPDATE ON profissional_repasse_competencia
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

ALTER TABLE profissional_dados_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE profissional_repasse_competencia ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE profissional_dados_pagamento FROM anon, authenticated;
REVOKE ALL ON TABLE profissional_repasse_competencia FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profissional_dados_pagamento TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profissional_repasse_competencia TO service_role;
