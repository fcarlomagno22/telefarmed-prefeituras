-- Notificações in-app para pacientes (Telefarmed Cidades)

CREATE TABLE IF NOT EXISTS public.paciente_app_notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  paciente_cpf CHAR(11) NOT NULL,
  comunicado_id UUID REFERENCES public.comunicados(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  corpo TEXT NOT NULL,
  prioridade public.prioridade_comunicado NOT NULL DEFAULT 'normal',
  remetente_nome TEXT NOT NULL DEFAULT 'Telefarmed',
  lido_em TIMESTAMPTZ,
  excluido_em TIMESTAMPTZ,
  enviado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT paciente_app_notificacoes_cpf_format CHECK (paciente_cpf ~ '^[0-9]{11}$'),
  CONSTRAINT paciente_app_notificacoes_titulo_nao_vazio CHECK (char_length(trim(titulo)) > 0),
  CONSTRAINT paciente_app_notificacoes_corpo_nao_vazio CHECK (char_length(trim(corpo)) > 0)
);

CREATE INDEX IF NOT EXISTS paciente_app_notificacoes_inbox_idx
  ON public.paciente_app_notificacoes (paciente_cpf, enviado_em DESC)
  WHERE excluido_em IS NULL;

CREATE INDEX IF NOT EXISTS paciente_app_notificacoes_unread_idx
  ON public.paciente_app_notificacoes (paciente_cpf)
  WHERE excluido_em IS NULL AND lido_em IS NULL;

ALTER TABLE public.paciente_app_notificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_paciente_app_notificacoes" ON public.paciente_app_notificacoes;
DROP POLICY IF EXISTS "anon_update_paciente_app_notificacoes" ON public.paciente_app_notificacoes;

CREATE POLICY "anon_select_paciente_app_notificacoes"
  ON public.paciente_app_notificacoes FOR SELECT TO anon USING (excluido_em IS NULL);

CREATE POLICY "anon_update_paciente_app_notificacoes"
  ON public.paciente_app_notificacoes FOR UPDATE TO anon USING (true) WITH CHECK (true);

GRANT SELECT, UPDATE ON TABLE public.paciente_app_notificacoes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.paciente_app_notificacoes TO service_role;
