GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE config_profissoes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE config_especialidades TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE config_especialidade_profissao TO service_role;
GRANT SELECT ON vw_config_especialidades_com_profissoes TO service_role;
GRANT EXECUTE ON FUNCTION salvar_config_clinico(JSONB) TO service_role;
