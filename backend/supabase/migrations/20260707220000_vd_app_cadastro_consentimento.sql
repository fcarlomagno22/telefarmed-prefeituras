-- Portal VD (app cidades) + termos legais do cadastro self-service

ALTER TABLE config_documentos_legais
  DROP CONSTRAINT IF EXISTS config_documentos_legais_portais_validos;

ALTER TABLE config_documentos_legais
  ADD CONSTRAINT config_documentos_legais_portais_validos CHECK (
    portais <@ ARRAY['admin', 'prefeitura', 'ubt', 'terminal', 'vd']::TEXT[]
  );

INSERT INTO config_documentos_legais (id, titulo, conteudo, versao, rotulo_atualizacao, publicado, portais, ordem)
VALUES
  (
    'vd_cadastro_termos_uso',
    'Termos de Uso — App Cidadão',
    $txt$[TEXTO DE TESTE — substituir posteriormente]

Ao utilizar o aplicativo Telefarmed Sua Cidade, você declara ter lido e concordado com estes Termos de Uso.

O serviço destina-se a moradores do município contratante, mediante cadastro com dados verdadeiros. Você é responsável pela confidencialidade de sua senha e pelas informações fornecidas no cadastro.

Situações de urgência ou emergência exigem atendimento presencial imediato.$txt$,
    '1.0',
    'Jul/2026',
    true,
    ARRAY['vd'],
    20
  )
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  conteudo = EXCLUDED.conteudo,
  versao = EXCLUDED.versao,
  rotulo_atualizacao = EXCLUDED.rotulo_atualizacao,
  publicado = EXCLUDED.publicado,
  portais = EXCLUDED.portais,
  ordem = EXCLUDED.ordem;

UPDATE config_documentos_legais
SET portais = (
  SELECT ARRAY(
    SELECT DISTINCT unnest(portais || ARRAY['vd']::TEXT[])
    ORDER BY 1
  )
)
WHERE id IN (
  'privacidade',
  'lgpd',
  'cadastro_conferencia_dados',
  'cadastro_autorizacao_teleconsulta',
  'cadastro_ciencia_dados',
  'cadastro_permissao_notificacoes'
);
