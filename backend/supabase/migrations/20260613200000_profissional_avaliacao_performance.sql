-- Índices para leitura de avaliações no portal profissional
CREATE INDEX IF NOT EXISTS idx_consulta_avaliacoes_consulta_id
  ON public.consulta_avaliacoes (consulta_id);

CREATE INDEX IF NOT EXISTS idx_consulta_avaliacoes_avaliado_em_desc
  ON public.consulta_avaliacoes (avaliado_em DESC);

CREATE INDEX IF NOT EXISTS idx_consulta_avaliacoes_nota_profissional
  ON public.consulta_avaliacoes (nota_profissional)
  WHERE nota_profissional IS NOT NULL;
