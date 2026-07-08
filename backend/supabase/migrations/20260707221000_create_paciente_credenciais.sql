-- Credenciais de login do app cidadão (VD) — tabela própria, sem Supabase Auth

CREATE TABLE paciente_credenciais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  entidade_contratante_id UUID NOT NULL REFERENCES entidades_contratantes(id) ON DELETE RESTRICT,
  cpf CHAR(11) NOT NULL,
  senha_hash TEXT NOT NULL,
  status status_usuario_admin NOT NULL DEFAULT 'ativo',
  tentativas_login_falhas SMALLINT NOT NULL DEFAULT 0,
  bloqueado_ate TIMESTAMPTZ,
  ultimo_login_em TIMESTAMPTZ,
  senha_alterada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT paciente_credenciais_cpf_digitos CHECK (cpf ~ '^[0-9]{11}$'),
  CONSTRAINT paciente_credenciais_tentativas_nao_negativas CHECK (tentativas_login_falhas >= 0),
  CONSTRAINT paciente_credenciais_senha_nao_vazia CHECK (char_length(trim(senha_hash)) > 0)
);

CREATE UNIQUE INDEX paciente_credenciais_paciente_uidx
  ON paciente_credenciais (paciente_id);

CREATE UNIQUE INDEX paciente_credenciais_entidade_cpf_uidx
  ON paciente_credenciais (entidade_contratante_id, cpf);

CREATE INDEX paciente_credenciais_status_idx
  ON paciente_credenciais (status);

CREATE INDEX paciente_credenciais_entidade_idx
  ON paciente_credenciais (entidade_contratante_id);

CREATE OR REPLACE FUNCTION public.preencher_paciente_credencial_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  pac RECORD;
BEGIN
  SELECT p.cpf, p.entidade_contratante_id
  INTO pac
  FROM pacientes p
  WHERE p.id = NEW.paciente_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Paciente não encontrado.';
  END IF;

  NEW.cpf := pac.cpf;
  NEW.entidade_contratante_id := pac.entidade_contratante_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER paciente_credenciais_preencher_snapshot
  BEFORE INSERT OR UPDATE OF paciente_id
  ON paciente_credenciais
  FOR EACH ROW
  EXECUTE FUNCTION public.preencher_paciente_credencial_snapshot();

CREATE TRIGGER paciente_credenciais_definir_atualizado_em
  BEFORE UPDATE ON paciente_credenciais
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

ALTER TABLE paciente_credenciais ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE paciente_credenciais FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE paciente_credenciais TO service_role;

-- Sessões refresh do app cidadão (VD)

CREATE TABLE sessoes_refresh_paciente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credencial_id UUID NOT NULL REFERENCES paciente_credenciais(id) ON DELETE CASCADE,
  hash_token TEXT NOT NULL,
  expira_em TIMESTAMPTZ NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  revogado_em TIMESTAMPTZ,
  substituido_por_id UUID REFERENCES sessoes_refresh_paciente(id) ON DELETE SET NULL,
  agente_usuario TEXT,
  endereco_ip INET
);

CREATE UNIQUE INDEX sessoes_refresh_paciente_hash_token_uidx
  ON sessoes_refresh_paciente (hash_token);

CREATE INDEX sessoes_refresh_paciente_credencial_ativo_idx
  ON sessoes_refresh_paciente (credencial_id, expira_em DESC)
  WHERE revogado_em IS NULL;

ALTER TABLE sessoes_refresh_paciente ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE sessoes_refresh_paciente FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sessoes_refresh_paciente TO service_role;

COMMENT ON TABLE paciente_credenciais IS
  'Login do app cidadão (VD): senha própria por paciente/entidade; CPF único por município contratante.';

COMMENT ON TABLE sessoes_refresh_paciente IS
  'Refresh tokens opacos (SHA-256) das sessões do app cidadão; rotação e revogação pelo backend.';

COMMENT ON COLUMN sessoes_refresh_paciente.credencial_id IS
  'Referência a paciente_credenciais.id (identidade autenticável do app).';
