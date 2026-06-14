-- Corrige exclusão de entidade e índices de busca para credenciais prefeitura

CREATE INDEX IF NOT EXISTS usuarios_prefeitura_entidade_status_nome_idx
  ON usuarios_prefeitura (entidade_contratante_id, status, nome);

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

  DELETE FROM usuarios_ubt
  WHERE entidade_contratante_id = p_entidade_id
     OR unidade_ubt_id IN (
       SELECT id FROM unidades_ubt WHERE entidade_contratante_id = p_entidade_id
     );

  DELETE FROM usuarios_prefeitura
  WHERE entidade_contratante_id = p_entidade_id;

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
