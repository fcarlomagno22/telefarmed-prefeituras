-- Documentos legais obrigatórios do cadastro no app cidadão (vd) + portal APP

ALTER TABLE config_documentos_legais
  DROP CONSTRAINT IF EXISTS config_documentos_legais_portais_validos;

ALTER TABLE config_documentos_legais
  ADD CONSTRAINT config_documentos_legais_portais_validos CHECK (
    portais <@ ARRAY['admin', 'prefeitura', 'ubt', 'terminal', 'vd']::TEXT[]
  );

INSERT INTO config_documentos_legais (id, titulo, conteudo, versao, rotulo_atualizacao, publicado, portais, ordem)
VALUES
  (
    'privacidade',
    'Política de privacidade',
    $txt$A Telefarmed trata dados pessoais em conformidade com a Lei nº 13.709/2018 (LGPD), utilizando informações de saúde e cadastro exclusivamente para prestação do serviço contratado, segurança e melhoria da plataforma.

Coletamos informações de cadastro (nome, CPF, contato e endereço), dados de saúde registrados no app, histórico de consultas e preferências de uso para prestar teleatendimento e funcionalidades de bem-estar.

Seus dados podem ser compartilhados com profissionais de saúde do programa e prestadores essenciais ao atendimento. Não vendemos dados pessoais.$txt$,
    '1.0',
    'Jul/2026',
    true,
    ARRAY['admin', 'prefeitura', 'ubt', 'terminal', 'vd'],
    3
  ),
  (
    'lgpd',
    'LGPD — direitos do titular',
    $txt$O titular de dados pode solicitar confirmação de tratamento, acesso, correção, anonimização ou eliminação de dados, mediante canal indicado pelo controlador (entidade contratante) ou pela Telefarmed como operadora.

Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados pessoais. Para exercer seus direitos, fale com o suporte Telefarmed.$txt$,
    '1.0',
    'Jul/2026',
    true,
    ARRAY['admin', 'prefeitura', 'ubt', 'terminal', 'vd'],
    5
  ),
  (
    'vd_cadastro_termos_uso',
    'Termos de Uso — App Cidadão',
    $txt$Ao utilizar o aplicativo Telefarmed, você concorda com estes Termos de Uso e com a Política de Privacidade.

O app destina-se ao acompanhamento de saúde, agendamentos e ferramentas de bem-estar vinculadas ao programa contratado. É proibido compartilhar credenciais ou usar o serviço de forma fraudulenta.

Consultas e registros clínicos seguem protocolos do serviço de saúde contratado. O app não substitui atendimento presencial ou de emergência.

Você é responsável pela veracidade dos dados informados e pela segurança do seu dispositivo.$txt$,
    '1.0',
    'Jul/2026',
    true,
    ARRAY['vd'],
    20
  ),
  (
    'cadastro_autorizacao_teleconsulta',
    'Autorização para atendimento por teleconsulta',
    $txt$O paciente (ou responsável legal, quando aplicável) autoriza a realização de atendimentos de saúde por teleconsulta, nos termos da regulamentação vigente.

Está ciente de que a teleconsulta possui limitações próprias do meio digital e que situações de urgência ou emergência exigem atendimento presencial imediato.

A autorização abrange consultas, orientações, encaminhamentos e demais procedimentos clínicos realizados remotamente pela rede contratada.$txt$,
    '1.0',
    'Jul/2026',
    true,
    ARRAY['admin', 'prefeitura', 'ubt', 'terminal', 'vd'],
    11
  ),
  (
    'cadastro_ciencia_dados',
    'Ciência sobre uso de dados para assistência e registros administrativos',
    $txt$O titular dos dados (ou responsável legal) declara ciência de que suas informações pessoais e de saúde serão utilizadas para:

• Prestação do serviço de teleatendimento e continuidade do cuidado;
• Registro em prontuário eletrônico e histórico assistencial;
• Comunicação operacional com a unidade de saúde e entidade contratante;
• Cumprimento de obrigações legais e regulatórias.

O tratamento ocorre conforme a Lei nº 13.709/2018 (LGPD) e normas aplicáveis ao setor de saúde.$txt$,
    '1.0',
    'Jul/2026',
    true,
    ARRAY['admin', 'prefeitura', 'ubt', 'terminal', 'vd'],
    12
  ),
  (
    'cadastro_permissao_notificacoes',
    'Permissão para receber notificações',
    $txt$O titular autoriza o envio de notificações relacionadas ao serviço de saúde, incluindo:

• Confirmações e lembretes de consultas;
• Orientações pós-atendimento e retorno de exames, quando disponibilizados pelo serviço;
• Comunicados operacionais da entidade contratante.

As notificações poderão ser enviadas por SMS, WhatsApp, e-mail ou outros canais informados no cadastro.$txt$,
    '1.0',
    'Jul/2026',
    true,
    ARRAY['admin', 'prefeitura', 'ubt', 'terminal', 'vd'],
    13
  )
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  conteudo = EXCLUDED.conteudo,
  versao = EXCLUDED.versao,
  rotulo_atualizacao = EXCLUDED.rotulo_atualizacao,
  publicado = EXCLUDED.publicado,
  portais = EXCLUDED.portais,
  ordem = EXCLUDED.ordem,
  atualizado_em = now();

-- Garante portal vd nos documentos já existentes usados pelo app
UPDATE config_documentos_legais
SET portais = (
  SELECT ARRAY(
    SELECT DISTINCT unnest(portais || ARRAY['vd']::TEXT[])
    ORDER BY 1
  )
),
publicado = true,
atualizado_em = now()
WHERE id IN (
  'privacidade',
  'lgpd',
  'cadastro_autorizacao_teleconsulta',
  'cadastro_ciencia_dados',
  'cadastro_permissao_notificacoes'
);
