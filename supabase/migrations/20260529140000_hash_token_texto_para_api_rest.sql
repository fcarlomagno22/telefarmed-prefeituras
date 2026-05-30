ALTER TABLE sessoes_refresh_admin
  ALTER COLUMN hash_token TYPE TEXT USING encode(hash_token, 'hex');

COMMENT ON COLUMN sessoes_refresh_admin.hash_token IS 'SHA-256 do refresh token em hexadecimal';
