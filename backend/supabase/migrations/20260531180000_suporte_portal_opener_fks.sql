-- Suporte portal: FKs de abertura e autoria de mensagens (escopo multi-tenant)

ALTER TABLE chamados_suporte
  ADD COLUMN IF NOT EXISTS aberto_por_usuario_prefeitura_id UUID REFERENCES usuarios_prefeitura(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS aberto_por_usuario_ubt_id UUID REFERENCES usuarios_ubt(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS chamados_suporte_aberto_prefeitura_idx
  ON chamados_suporte (aberto_por_usuario_prefeitura_id)
  WHERE aberto_por_usuario_prefeitura_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS chamados_suporte_aberto_ubt_idx
  ON chamados_suporte (aberto_por_usuario_ubt_id)
  WHERE aberto_por_usuario_ubt_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chamados_suporte_profissional_referencia_fk'
  ) THEN
    ALTER TABLE chamados_suporte
      ADD CONSTRAINT chamados_suporte_profissional_referencia_fk
      FOREIGN KEY (profissional_referencia_id) REFERENCES usuarios_profissionais(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE mensagens_chamado_suporte
  ADD COLUMN IF NOT EXISTS autor_usuario_prefeitura_id UUID REFERENCES usuarios_prefeitura(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS autor_usuario_ubt_id UUID REFERENCES usuarios_ubt(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS autor_profissional_id UUID REFERENCES usuarios_profissionais(id) ON DELETE SET NULL;

CREATE OR REPLACE VIEW vw_chamados_suporte_listagem AS
SELECT
  c.id,
  c.numero_exibicao,
  c.assunto,
  c.categoria,
  c.status,
  c.prioridade,
  c.origem,
  c.municipio_nome,
  c.unidade_ubt_id,
  c.unidade_ubt_nome,
  c.aberto_por_nome,
  c.aberto_por_funcao,
  c.aberto_em,
  c.atualizado_em,
  c.encerrado_em,
  c.entidade_contratante_id,
  c.aberto_por_usuario_prefeitura_id,
  c.aberto_por_usuario_ubt_id,
  c.profissional_referencia_id
FROM chamados_suporte c;
