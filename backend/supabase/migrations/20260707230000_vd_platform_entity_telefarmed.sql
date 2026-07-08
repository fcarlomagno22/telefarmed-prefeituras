-- Entidade real da plataforma Telefarmed para vd.telefarmed.com.br (app cidadão próprio).

INSERT INTO entidades_contratantes (
  id,
  razao_social,
  municipio,
  uf,
  status,
  nome_exibicao,
  subtitulo,
  cnpj,
  status_cliente,
  tipo_entidade,
  nome_marca,
  cor_primaria,
  slug,
  slug_locked_at
)
VALUES (
  'f0000000-0000-4000-8000-000000000001',
  'Telefarmed Tecnologia em Saúde Ltda',
  'São Paulo',
  'SP',
  'ativo',
  'Telefarmed',
  'Saúde Conectada',
  '',
  'ativa',
  'generico',
  'Telefarmed',
  '#f97316',
  'telefarmed-app',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  razao_social = EXCLUDED.razao_social,
  nome_exibicao = EXCLUDED.nome_exibicao,
  subtitulo = EXCLUDED.subtitulo,
  status_cliente = EXCLUDED.status_cliente,
  tipo_entidade = EXCLUDED.tipo_entidade,
  nome_marca = EXCLUDED.nome_marca,
  cor_primaria = EXCLUDED.cor_primaria,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  atualizado_em = now();

INSERT INTO contratos_entidade (
  id,
  entidade_contratante_id,
  numero,
  tipo,
  status,
  data_assinatura,
  aceita_pacientes_outros_municipios
)
SELECT
  'f0000000-0000-4000-8000-000000000002',
  'f0000000-0000-4000-8000-000000000001',
  'TF-APP-001',
  (SELECT id FROM config_tipos_contrato ORDER BY id LIMIT 1),
  'ativo',
  CURRENT_DATE,
  false
WHERE EXISTS (SELECT 1 FROM config_tipos_contrato LIMIT 1)
ON CONFLICT (id) DO UPDATE SET
  status = 'ativo',
  aceita_pacientes_outros_municipios = false,
  atualizado_em = now();
