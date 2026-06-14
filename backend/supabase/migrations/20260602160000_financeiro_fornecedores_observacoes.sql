-- Observações internas do fornecedor (ex.: o que fornece, ramo de atividade)
ALTER TABLE financeiro_fornecedores
  ADD COLUMN IF NOT EXISTS observacoes TEXT NOT NULL DEFAULT '';
