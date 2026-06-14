-- RPCs atômicas e índice de busca para admin clientes

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'entidades_contratantes'
      AND column_name = 'nome_exibicao'
  ) THEN
    CREATE INDEX IF NOT EXISTS entidades_contratantes_busca_idx
      ON entidades_contratantes (
        lower(nome_exibicao),
        lower(razao_social),
        lower(municipio),
        cnpj
      );
  END IF;
END $$;

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
    permite_ultrapassar
  )
  VALUES (
    v_entidade_id,
    NULLIF(trim(p_payload->>'numero'), ''),
    p_payload->>'tipo',
    COALESCE(p_payload->>'status', 'ativo')::status_contrato_entidade,
    (p_payload->>'dataAssinatura')::DATE,
    NULLIF(p_payload->>'dataEncerramento', '')::DATE,
    NULLIF(p_payload->>'consultasContratadas', '')::INTEGER,
    COALESCE((p_payload->>'permiteUltrapassar')::BOOLEAN, false)
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

CREATE OR REPLACE FUNCTION excluir_entidade_cliente(p_entidade_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM entidades_contratantes WHERE id = p_entidade_id) THEN
    RAISE EXCEPTION 'Entidade não encontrada.' USING ERRCODE = 'P0002';
  END IF;

  -- Credenciais de portal (entidade ou UBTs vinculadas)
  DELETE FROM usuarios_portal
  WHERE entidade_contratante_id = p_entidade_id
     OR unidade_ubt_id IN (
       SELECT id FROM unidades_ubt WHERE entidade_contratante_id = p_entidade_id
     );

  DELETE FROM contratos_entidade WHERE entidade_contratante_id = p_entidade_id;
  DELETE FROM unidades_ubt WHERE entidade_contratante_id = p_entidade_id;
  DELETE FROM entidades_contratantes WHERE id = p_entidade_id;
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE EXCEPTION
      'Não é possível excluir: existem registros operacionais vinculados a esta entidade (consultas, pacientes ou outros).'
      USING ERRCODE = '23503';
END;
$$;

GRANT EXECUTE ON FUNCTION criar_contrato_entidade_cliente(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION excluir_entidade_cliente(UUID) TO service_role;
