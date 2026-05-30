-- Renomeia schema de autenticação admin para português

ALTER TYPE admin_user_status RENAME TO status_usuario_admin;
ALTER TYPE admin_access_level RENAME TO nivel_acesso_admin;
ALTER TYPE admin_department RENAME TO departamento_admin;

ALTER TABLE admin_users RENAME TO usuarios_admin;
ALTER TABLE admin_refresh_sessions RENAME TO sessoes_refresh_admin;

ALTER TABLE usuarios_admin RENAME COLUMN password_hash TO senha_hash;
ALTER TABLE usuarios_admin RENAME COLUMN access_level TO nivel_acesso;
ALTER TABLE usuarios_admin RENAME COLUMN department_id TO departamento;
ALTER TABLE usuarios_admin RENAME COLUMN is_master TO eh_master;
ALTER TABLE usuarios_admin RENAME COLUMN authorization_pin_hash TO pin_autorizacao_hash;
ALTER TABLE usuarios_admin RENAME COLUMN failed_login_attempts TO tentativas_login_falhas;
ALTER TABLE usuarios_admin RENAME COLUMN locked_until TO bloqueado_ate;
ALTER TABLE usuarios_admin RENAME COLUMN last_login_at TO ultimo_login_em;
ALTER TABLE usuarios_admin RENAME COLUMN password_changed_at TO senha_alterada_em;
ALTER TABLE usuarios_admin RENAME COLUMN created_at TO criado_em;
ALTER TABLE usuarios_admin RENAME COLUMN updated_at TO atualizado_em;

ALTER TABLE sessoes_refresh_admin RENAME COLUMN user_id TO usuario_id;
ALTER TABLE sessoes_refresh_admin RENAME COLUMN token_hash TO hash_token;
ALTER TABLE sessoes_refresh_admin RENAME COLUMN expires_at TO expira_em;
ALTER TABLE sessoes_refresh_admin RENAME COLUMN created_at TO criado_em;
ALTER TABLE sessoes_refresh_admin RENAME COLUMN revoked_at TO revogado_em;
ALTER TABLE sessoes_refresh_admin RENAME COLUMN replaced_by_id TO substituido_por_id;
ALTER TABLE sessoes_refresh_admin RENAME COLUMN user_agent TO agente_usuario;
ALTER TABLE sessoes_refresh_admin RENAME COLUMN ip_address TO endereco_ip;

ALTER TABLE usuarios_admin RENAME CONSTRAINT admin_users_cpf_digits TO usuarios_admin_cpf_digitos;
ALTER TABLE usuarios_admin RENAME CONSTRAINT admin_users_failed_attempts_nonneg TO usuarios_admin_tentativas_login_nao_negativas;

ALTER INDEX admin_users_cpf_uidx RENAME TO usuarios_admin_cpf_uidx;
ALTER INDEX admin_users_email_uidx RENAME TO usuarios_admin_email_uidx;
ALTER INDEX admin_users_status_idx RENAME TO usuarios_admin_status_idx;
ALTER INDEX admin_refresh_sessions_token_hash_uidx RENAME TO sessoes_refresh_admin_hash_token_uidx;
ALTER INDEX admin_refresh_sessions_user_active_idx RENAME TO sessoes_refresh_admin_usuario_ativo_idx;

ALTER FUNCTION public.set_updated_at() RENAME TO definir_atualizado_em;

DROP TRIGGER IF EXISTS admin_users_set_updated_at ON usuarios_admin;
CREATE TRIGGER usuarios_admin_definir_atualizado_em
  BEFORE UPDATE ON usuarios_admin
  FOR EACH ROW
  EXECUTE FUNCTION public.definir_atualizado_em();

CREATE OR REPLACE FUNCTION public.definir_atualizado_em()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON TABLE usuarios_admin FROM anon, authenticated;
REVOKE ALL ON TABLE sessoes_refresh_admin FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE usuarios_admin TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sessoes_refresh_admin TO service_role;
