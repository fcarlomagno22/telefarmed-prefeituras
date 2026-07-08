-- Portal de auditoria do app cidadão (VD) + RPC atômica credencial + sessão refresh

ALTER TYPE auditoria_portal ADD VALUE IF NOT EXISTS 'vd';

CREATE OR REPLACE FUNCTION public.vd_criar_credencial_app_sessao(
  p_paciente_id UUID,
  p_senha_hash TEXT,
  p_hash_token_refresh TEXT,
  p_expira_em TIMESTAMPTZ,
  p_agente_usuario TEXT DEFAULT NULL,
  p_endereco_ip TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credencial_id UUID;
BEGIN
  INSERT INTO paciente_credenciais (paciente_id, senha_hash)
  VALUES (p_paciente_id, p_senha_hash)
  RETURNING id INTO v_credencial_id;

  INSERT INTO sessoes_refresh_paciente (
    credencial_id,
    hash_token,
    expira_em,
    agente_usuario,
    endereco_ip
  )
  VALUES (
    v_credencial_id,
    p_hash_token_refresh,
    p_expira_em,
    NULLIF(trim(p_agente_usuario), ''),
    NULLIF(trim(p_endereco_ip), '')::INET
  );

  RETURN v_credencial_id;
END;
$$;

REVOKE ALL ON FUNCTION public.vd_criar_credencial_app_sessao(UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vd_criar_credencial_app_sessao(UUID, TEXT, TEXT, TIMESTAMPTZ, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.vd_criar_credencial_app_sessao IS
  'Cria paciente_credenciais + sessoes_refresh_paciente em transação única (cadastro app VD).';
