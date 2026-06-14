-- Garante chave profissionais na matriz RBAC de usuários admin existentes

UPDATE usuarios_admin
SET permissoes_paginas = permissoes_paginas || '{"profissionais":["visualizar","inserir","editar","excluir"]}'::jsonb
WHERE eh_master = false
  AND nivel_acesso = 'administrador'
  AND NOT permissoes_paginas ? 'profissionais';

UPDATE usuarios_admin
SET permissoes_paginas = jsonb_set(permissoes_paginas, '{profissionais}', '["visualizar"]'::jsonb, true)
WHERE eh_master = false
  AND nivel_acesso = 'visualizador'
  AND NOT permissoes_paginas ? 'profissionais';

UPDATE usuarios_admin
SET permissoes_paginas = jsonb_set(permissoes_paginas, '{profissionais}', '["visualizar","editar"]'::jsonb, true)
WHERE eh_master = false
  AND nivel_acesso = 'editor'
  AND NOT permissoes_paginas ? 'profissionais';
