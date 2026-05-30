-- Catálogo global de documentos legais
-- Leitura pública via API (somente publicados); mutações somente pelo backend (service_role)

CREATE TABLE config_documentos_legais (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL DEFAULT '',
  versao TEXT NOT NULL DEFAULT '1.0',
  rotulo_atualizacao TEXT NOT NULL DEFAULT '',
  publicado BOOLEAN NOT NULL DEFAULT false,
  portais TEXT[] NOT NULL DEFAULT '{}',
  ordem SMALLINT NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT config_documentos_legais_id_formato CHECK (char_length(id) BETWEEN 1 AND 64),
  CONSTRAINT config_documentos_legais_titulo_nao_vazio CHECK (char_length(trim(titulo)) > 0),
  CONSTRAINT config_documentos_legais_versao_nao_vazia CHECK (char_length(trim(versao)) > 0),
  CONSTRAINT config_documentos_legais_portais_validos CHECK (
    portais <@ ARRAY['admin', 'prefeitura', 'ubt', 'terminal']::TEXT[]
  )
);

CREATE INDEX config_documentos_legais_publicado_ordem_idx
  ON config_documentos_legais (publicado, ordem, titulo);
CREATE INDEX config_documentos_legais_portais_gin_idx
  ON config_documentos_legais USING GIN (portais);

CREATE TRIGGER config_documentos_legais_atualizado_em
  BEFORE UPDATE ON config_documentos_legais
  FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

INSERT INTO config_documentos_legais (id, titulo, conteudo, versao, rotulo_atualizacao, publicado, portais, ordem)
VALUES
  (
    'termos_uso',
    'Termos de uso',
    $termos$Estes Termos de Uso regulam o acesso e a utilização da plataforma Telefarmed pelos operadores autorizados das prefeituras contratantes e unidades UBT.

Ao acessar o sistema, o usuário declara ter lido e concordado com as condições aqui descritas.$termos$,
    '1.0',
    'Mai/2026',
    true,
    ARRAY['admin', 'prefeitura', 'ubt', 'terminal'],
    1
  ),
  (
    'faq',
    'Perguntas frequentes (FAQ)',
    $faq$## Como acesso o painel?
Utilize o e-mail e a senha fornecidos pelo gestor da sua unidade ou prefeitura.

## Esqueci minha senha
Solicite a redefinição ao responsável pela UBT ou abra um chamado em Suporte.$faq$,
    '1.0',
    'Mai/2026',
    true,
    ARRAY['admin', 'prefeitura', 'ubt', 'terminal'],
    2
  ),
  (
    'privacidade',
    'Política de privacidade',
    $priv$A Telefarmed trata dados pessoais em conformidade com a Lei nº 13.709/2018 (LGPD), utilizando informações de saúde e cadastro exclusivamente para prestação do serviço contratado, segurança e melhoria da plataforma.$priv$,
    '1.0',
    'Mai/2026',
    true,
    ARRAY['admin', 'prefeitura', 'ubt', 'terminal'],
    3
  ),
  (
    'consentimento_informado',
    'Termo de consentimento informado',
    $consent$Declaro estar ciente de que o atendimento por telemedicina possui limitações próprias do meio digital e autorizo o registro das informações clínicas necessárias à continuidade do cuidado, nos termos da regulamentação vigente.$consent$,
    '1.0',
    'Mai/2026',
    true,
    ARRAY['terminal', 'ubt', 'prefeitura'],
    4
  ),
  (
    'lgpd',
    'LGPD — direitos do titular',
    $lgpd$O titular de dados pode solicitar confirmação de tratamento, acesso, correção, anonimização ou eliminação de dados, mediante canal indicado pelo controlador (prefeitura contratante) ou pela Telefarmed como operadora.$lgpd$,
    '1.0',
    'Mai/2026',
    true,
    ARRAY['terminal', 'ubt', 'prefeitura'],
    5
  );
