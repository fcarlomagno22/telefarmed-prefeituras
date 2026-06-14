GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE comunicados TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE comunicado_destinatarios TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE usuarios_profissionais TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sessoes_refresh_ubt TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sessoes_refresh_profissional TO service_role;
GRANT SELECT ON vw_comunicados_admin_listagem TO service_role;
