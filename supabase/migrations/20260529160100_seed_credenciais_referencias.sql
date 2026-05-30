-- Referências iniciais para gestão de credenciais (entidade + UBTs de exemplo)

INSERT INTO entidades_contratantes (id, razao_social, municipio, uf, status)
VALUES (
  'a1000000-0000-4000-8000-000000000001',
  'Prefeitura Municipal de São José dos Campos',
  'São José dos Campos',
  'SP',
  'ativo'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO unidades_ubt (id, entidade_contratante_id, nome, ra_chave, ra_rotulo, codigo_externo, status)
VALUES
  (
    'b1000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    'UBT Centro',
    'central',
    'RA Central',
    'ubt-centro',
    'ativo'
  ),
  (
    'b1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000001',
    'UBT Norte',
    'norte',
    'RA Norte',
    'ubt-norte',
    'ativo'
  ),
  (
    'b1000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000001',
    'UBT Sul',
    'sul',
    'RA Sul',
    'ubt-sul',
    'ativo'
  ),
  (
    'b1000000-0000-4000-8000-000000000004',
    'a1000000-0000-4000-8000-000000000001',
    'UBT Leste',
    'leste',
    'RA Leste',
    'ubt-leste',
    'ativo'
  ),
  (
    'b1000000-0000-4000-8000-000000000005',
    'a1000000-0000-4000-8000-000000000001',
    'UBT Oeste',
    'oeste',
    'RA Oeste',
    'ubt-oeste',
    'ativo'
  )
ON CONFLICT (id) DO NOTHING;

-- Permissões padrão para usuários admin existentes sem matriz definida
UPDATE usuarios_admin
SET permissoes_paginas = CASE nivel_acesso
  WHEN 'administrador' THEN '{
    "dashboard":["visualizar","inserir","editar","excluir"],
    "clientes":["visualizar","inserir","editar","excluir"],
    "monitor":["visualizar","inserir","editar","excluir"],
    "pessoas":["visualizar","inserir","editar","excluir"],
    "gestaoEscala":["visualizar","inserir","editar","excluir"],
    "financeiro":["visualizar","inserir","editar","excluir"],
    "notificacoes":["visualizar","inserir","editar","excluir"],
    "suporte":["visualizar","inserir","editar","excluir"],
    "auditoria":["visualizar","inserir","editar","excluir"],
    "credenciais":["visualizar","inserir","editar","excluir"],
    "configuracoes":["visualizar","inserir","editar","excluir"]
  }'::jsonb
  WHEN 'visualizador' THEN '{
    "dashboard":["visualizar"],"clientes":["visualizar"],"monitor":["visualizar"],
    "pessoas":["visualizar"],"gestaoEscala":["visualizar"],"financeiro":["visualizar"],
    "notificacoes":["visualizar"],"suporte":["visualizar"],"auditoria":["visualizar"]
  }'::jsonb
  ELSE '{}'::jsonb
END
WHERE permissoes_paginas = '{}'::jsonb OR permissoes_paginas IS NULL;

UPDATE usuarios_admin
SET funcao = COALESCE(NULLIF(funcao, ''), 'Administrador')
WHERE funcao = '';
