-- Permissões de páginas do portal municipal (/prefeitura/*)
-- Gestores prefeitura usam permissoes_paginas; operadores UBT continuam em permissoes_sistema

ALTER TABLE usuarios_portal
  ADD COLUMN IF NOT EXISTS permissoes_paginas JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN usuarios_portal.permissoes_paginas IS
  'Mapa pagina_id -> ações do portal municipal (/prefeitura). Usado quando escopo_portal = prefeitura.';

COMMENT ON COLUMN usuarios_portal.permissoes_sistema IS
  'Mapa pagina_id -> ações do terminal UBT (/ubt). Usado quando escopo_portal = ubt.';

CREATE INDEX IF NOT EXISTS usuarios_portal_permissoes_paginas_gin_idx
  ON usuarios_portal USING gin (permissoes_paginas)
  WHERE escopo_portal = 'prefeitura';

DROP VIEW IF EXISTS vw_credenciais_portal_listagem;

CREATE VIEW vw_credenciais_portal_listagem AS
SELECT
  id,
  cpf,
  nome,
  email,
  funcao,
  nivel_acesso,
  escopo_portal,
  status,
  entidade_contratante_id,
  unidade_ubt_id,
  eh_responsavel_ubt,
  permissoes_sistema,
  permissoes_paginas,
  entidade_razao_social,
  municipio,
  uf,
  unidade_ubt_nome,
  ra_chave,
  ra_rotulo,
  (senha_hash IS NOT NULL AND senha_hash <> '') AS possui_senha,
  (pin_autorizacao_hash IS NOT NULL) AS possui_pin_autorizacao,
  ultimo_login_em,
  criado_em,
  atualizado_em
FROM usuarios_portal;

GRANT SELECT ON vw_credenciais_portal_listagem TO service_role;
