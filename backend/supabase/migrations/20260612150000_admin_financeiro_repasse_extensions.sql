-- Extensões admin financeiro: repasse profissional ↔ contas a pagar

CREATE TYPE conta_pagar_origem AS ENUM ('manual', 'repasse_profissional');

CREATE TYPE conta_pagar_repasse_conferencia AS ENUM ('pendente_conferencia', 'conferido');

ALTER TABLE financeiro_contas_pagar
  ADD COLUMN IF NOT EXISTS origem conta_pagar_origem NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS profissional_fechamento_id UUID REFERENCES profissional_fechamento_competencia(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS motivo_ajuste TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS repasse_conferencia_status conta_pagar_repasse_conferencia,
  ADD COLUMN IF NOT EXISTS repasse_snapshot JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS financeiro_contas_pagar_fechamento_uidx
  ON financeiro_contas_pagar (profissional_fechamento_id)
  WHERE profissional_fechamento_id IS NOT NULL;

ALTER TABLE profissional_fechamento_competencia
  ADD COLUMN IF NOT EXISTS valor_calculado_centavos INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_aprovado_centavos INTEGER,
  ADD COLUMN IF NOT EXISTS motivo_ajuste TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS valor_nf_centavos INTEGER,
  ADD COLUMN IF NOT EXISTS conta_pagar_id UUID REFERENCES financeiro_contas_pagar(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS aprovado_por_admin_id UUID REFERENCES usuarios_admin(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS correcao_motivo TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS plantoes_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS profissional_fechamento_conta_pagar_idx
  ON profissional_fechamento_competencia (conta_pagar_id)
  WHERE conta_pagar_id IS NOT NULL;

COMMENT ON COLUMN financeiro_contas_pagar.repasse_snapshot IS
  'Snapshot imutável da auditoria de repasse (plantões, valores) no momento da aprovação.';

COMMENT ON COLUMN profissional_fechamento_competencia.plantoes_snapshot IS
  'Cache de plantões auditáveis com repasseRule copiada de escala_slots.repasse_regra.';

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profissional_fechamento_competencia TO service_role;
