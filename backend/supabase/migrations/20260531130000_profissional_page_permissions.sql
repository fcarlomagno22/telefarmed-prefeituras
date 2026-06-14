-- Permissões por página no portal profissional

ALTER TABLE usuarios_profissionais
  ADD COLUMN IF NOT EXISTS permissoes_paginas JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN usuarios_profissionais.permissoes_paginas IS
  'Mapa pagina_id -> [visualizar, inserir, editar, excluir] para RBAC do portal profissional.';

UPDATE usuarios_profissionais
SET permissoes_paginas = '{
  "agenda": ["visualizar", "inserir", "editar", "excluir"],
  "atendimentos": ["visualizar", "inserir", "editar", "excluir"],
  "escala": ["visualizar", "inserir", "editar", "excluir"],
  "financeiro": ["visualizar", "inserir", "editar", "excluir"],
  "avaliacao": ["visualizar", "inserir", "editar", "excluir"],
  "suporte": ["visualizar", "inserir", "editar", "excluir"],
  "notificacoes": ["visualizar", "inserir", "editar", "excluir"],
  "perfil": ["visualizar", "inserir", "editar", "excluir"]
}'::jsonb
WHERE permissoes_paginas = '{}'::jsonb;
