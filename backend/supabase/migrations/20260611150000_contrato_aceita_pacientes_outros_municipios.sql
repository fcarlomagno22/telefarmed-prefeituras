-- Política de elegibilidade territorial de pacientes por contrato

ALTER TABLE contratos_entidade
  ADD COLUMN IF NOT EXISTS aceita_pacientes_outros_municipios BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN contratos_entidade.aceita_pacientes_outros_municipios IS
  'Quando false, pré-cadastro e cadastro de pacientes exigem CEP/endereço no município contratante.';

UPDATE contratos_entidade
SET aceita_pacientes_outros_municipios = false
WHERE aceita_pacientes_outros_municipios IS DISTINCT FROM false;

CREATE OR REPLACE FUNCTION criar_contrato_entidade_cliente(p_payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entidade_id UUID;
  v_contrato_id UUID;
  v_item JSONB;
BEGIN
  v_entidade_id := NULLIF(trim(p_payload->>'entidadeId'), '')::UUID;

  IF v_entidade_id IS NULL THEN
    RAISE EXCEPTION 'Entidade inválida.' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM entidades_contratantes WHERE id = v_entidade_id) THEN
    RAISE EXCEPTION 'Entidade não encontrada.' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO contratos_entidade (
    entidade_contratante_id,
    numero,
    tipo,
    status,
    data_assinatura,
    data_encerramento,
    consultas_contratadas,
    permite_ultrapassar,
    aceita_pacientes_outros_municipios
  )
  VALUES (
    v_entidade_id,
    NULLIF(trim(p_payload->>'numero'), ''),
    p_payload->>'tipo',
    COALESCE(p_payload->>'status', 'ativo')::status_contrato_entidade,
    (p_payload->>'dataAssinatura')::DATE,
    NULLIF(p_payload->>'dataEncerramento', '')::DATE,
    NULLIF(p_payload->>'consultasContratadas', '')::INTEGER,
    COALESCE((p_payload->>'permiteUltrapassar')::BOOLEAN, false),
    COALESCE((p_payload->>'aceitaPacientesOutrosMunicipios')::BOOLEAN, false)
  )
  RETURNING id INTO v_contrato_id;

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_payload->'especialidadesAutorizadas', '[]'::jsonb))
  LOOP
    INSERT INTO contrato_entidade_especialidades (contrato_id, especialidade_id)
    VALUES (v_contrato_id, trim(v_item #>> '{}'))
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_payload->'precosProfissao', '[]'::jsonb))
  LOOP
    INSERT INTO contrato_entidade_precos_profissao (
      contrato_id,
      profissao_id,
      tipo,
      valor_consulta_centavos
    )
    VALUES (
      v_contrato_id,
      v_item->>'professionId',
      COALESCE(v_item->>'tipo', 'contratado')::contrato_preco_tipo,
      (v_item->>'valorCentavos')::INTEGER
    );
  END LOOP;

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_payload->'precosEspecialidade', '[]'::jsonb))
  LOOP
    INSERT INTO contrato_entidade_precos_especialidade (
      contrato_id,
      especialidade_id,
      tipo,
      valor_consulta_centavos
    )
    VALUES (
      v_contrato_id,
      v_item->>'specialtyId',
      COALESCE(v_item->>'tipo', 'contratado')::contrato_preco_tipo,
      (v_item->>'valorCentavos')::INTEGER
    );
  END LOOP;

  RETURN v_contrato_id;
END;
$$;

CREATE OR REPLACE FUNCTION atualizar_contrato_entidade_cliente(
  p_contrato_id UUID,
  p_payload JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contrato_id UUID;
  v_item JSONB;
BEGIN
  v_contrato_id := p_contrato_id;

  IF v_contrato_id IS NULL THEN
    RAISE EXCEPTION 'Contrato inválido.' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM contratos_entidade WHERE id = v_contrato_id) THEN
    RAISE EXCEPTION 'Contrato não encontrado.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE contratos_entidade
  SET
    numero = NULLIF(trim(p_payload->>'numero'), ''),
    tipo = p_payload->>'tipo',
    data_assinatura = (p_payload->>'dataAssinatura')::DATE,
    data_encerramento = NULLIF(p_payload->>'dataEncerramento', '')::DATE,
    consultas_contratadas = NULLIF(p_payload->>'consultasContratadas', '')::INTEGER,
    permite_ultrapassar = COALESCE((p_payload->>'permiteUltrapassar')::BOOLEAN, false),
    aceita_pacientes_outros_municipios = COALESCE(
      (p_payload->>'aceitaPacientesOutrosMunicipios')::BOOLEAN,
      false
    )
  WHERE id = v_contrato_id;

  DELETE FROM contrato_entidade_especialidades WHERE contrato_id = v_contrato_id;
  DELETE FROM contrato_entidade_precos_profissao WHERE contrato_id = v_contrato_id;
  DELETE FROM contrato_entidade_precos_especialidade WHERE contrato_id = v_contrato_id;

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_payload->'especialidadesAutorizadas', '[]'::jsonb))
  LOOP
    INSERT INTO contrato_entidade_especialidades (contrato_id, especialidade_id)
    VALUES (v_contrato_id, trim(v_item #>> '{}'))
    ON CONFLICT DO NOTHING;
  END LOOP;

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_payload->'precosProfissao', '[]'::jsonb))
  LOOP
    INSERT INTO contrato_entidade_precos_profissao (
      contrato_id,
      profissao_id,
      tipo,
      valor_consulta_centavos
    )
    VALUES (
      v_contrato_id,
      v_item->>'professionId',
      COALESCE(v_item->>'tipo', 'contratado')::contrato_preco_tipo,
      (v_item->>'valorCentavos')::INTEGER
    );
  END LOOP;

  FOR v_item IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_payload->'precosEspecialidade', '[]'::jsonb))
  LOOP
    INSERT INTO contrato_entidade_precos_especialidade (
      contrato_id,
      especialidade_id,
      tipo,
      valor_consulta_centavos
    )
    VALUES (
      v_contrato_id,
      v_item->>'specialtyId',
      COALESCE(v_item->>'tipo', 'contratado')::contrato_preco_tipo,
      (v_item->>'valorCentavos')::INTEGER
    );
  END LOOP;

  RETURN v_contrato_id;
END;
$$;

GRANT EXECUTE ON FUNCTION criar_contrato_entidade_cliente(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION atualizar_contrato_entidade_cliente(UUID, JSONB) TO service_role;
