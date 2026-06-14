-- Preços contratuais por profissão (padrão) complementando preços por especialidade

CREATE TABLE contrato_entidade_precos_profissao (
  contrato_id UUID NOT NULL REFERENCES contratos_entidade(id) ON DELETE CASCADE,
  profissao_id TEXT NOT NULL REFERENCES config_profissoes(id) ON DELETE RESTRICT,
  tipo contrato_preco_tipo NOT NULL,
  valor_consulta_centavos INTEGER NOT NULL,
  PRIMARY KEY (contrato_id, profissao_id, tipo),
  CONSTRAINT contrato_entidade_precos_profissao_valor_positivo CHECK (valor_consulta_centavos > 0)
);

CREATE INDEX contrato_entidade_precos_profissao_contrato_idx
  ON contrato_entidade_precos_profissao (contrato_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE contrato_entidade_precos_profissao TO service_role;

ALTER TABLE contrato_entidade_precos_profissao ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE contrato_entidade_precos_profissao FROM anon, authenticated;
