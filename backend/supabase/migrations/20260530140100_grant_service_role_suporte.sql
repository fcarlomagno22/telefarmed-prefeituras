GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE chamados_suporte TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE mensagens_chamado_suporte TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE anexos_mensagem_chamado TO service_role;
GRANT SELECT ON vw_chamados_suporte_listagem TO service_role;
GRANT USAGE, SELECT ON SEQUENCE chamados_suporte_numero_seq TO service_role;
