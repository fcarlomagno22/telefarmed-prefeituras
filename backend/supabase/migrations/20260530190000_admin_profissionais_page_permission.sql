-- Permissão da página Profissionais (candidaturas + ativos) para admins existentes

UPDATE usuarios_admin
SET permissoes_paginas = permissoes_paginas || '{"profissionais":["visualizar","inserir","editar","excluir"]}'::jsonb
WHERE nivel_acesso = 'administrador'
  AND (permissoes_paginas ? 'profissionais') IS NOT TRUE;

UPDATE usuarios_admin
SET permissoes_paginas = permissoes_paginas || '{"profissionais":["visualizar","editar"]}'::jsonb
WHERE nivel_acesso = 'editor'
  AND (permissoes_paginas ? 'profissionais') IS NOT TRUE;

UPDATE usuarios_admin
SET permissoes_paginas = permissoes_paginas || '{"profissionais":["visualizar"]}'::jsonb
WHERE nivel_acesso = 'visualizador'
  AND (permissoes_paginas ? 'profissionais') IS NOT TRUE;

UPDATE usuarios_admin
SET permissoes_paginas = permissoes_paginas || '{"profissionais":["visualizar"]}'::jsonb
WHERE nivel_acesso = 'operador'
  AND (permissoes_paginas ? 'profissionais') IS NOT TRUE;
