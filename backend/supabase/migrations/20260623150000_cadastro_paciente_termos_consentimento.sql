-- Termos legais exibidos na etapa final de consentimento do cadastro de paciente

INSERT INTO config_documentos_legais (id, titulo, conteudo, versao, rotulo_atualizacao, publicado, portais, ordem)
VALUES
  (
    'cadastro_conferencia_dados',
    'Confirmação de conferência dos dados cadastrais',
    $txt$[TEXTO DE TESTE — substituir posteriormente]

Ao marcar esta opção, o operador responsável pelo cadastro declara que conferiu, junto ao paciente ou responsável legal, os dados pessoais, documentos e informações de contato informados neste formulário.

A conferência inclui, quando aplicável: nome completo, CPF, CNS, data de nascimento, sexo, nacionalidade, raça/cor, endereço, telefones, e-mail e dados do responsável legal.

Eventuais correções devem ser feitas antes da conclusão do cadastro.$txt$,
    '1.0',
    'Jun/2026',
    true,
    ARRAY['admin', 'prefeitura', 'ubt', 'terminal'],
    10
  ),
  (
    'cadastro_autorizacao_teleconsulta',
    'Autorização para atendimento por teleconsulta',
    $txt$[TEXTO DE TESTE — substituir posteriormente]

O paciente (ou responsável legal, quando aplicável) autoriza a realização de atendimentos de saúde por teleconsulta, nos termos da regulamentação vigente.

Está ciente de que a teleconsulta possui limitações próprias do meio digital e que situações de urgência ou emergência exigem atendimento presencial imediato.

A autorização abrange consultas, orientações, encaminhamentos e demais procedimentos clínicos realizados remotamente pela rede contratada.$txt$,
    '1.0',
    'Jun/2026',
    true,
    ARRAY['admin', 'prefeitura', 'ubt', 'terminal'],
    11
  ),
  (
    'cadastro_ciencia_dados',
    'Ciência sobre uso de dados para assistência e registros administrativos',
    $txt$[TEXTO DE TESTE — substituir posteriormente]

O titular dos dados (ou responsável legal) declara ciência de que suas informações pessoais e de saúde serão utilizadas para:

• Prestação do serviço de teleatendimento e continuidade do cuidado;
• Registro em prontuário eletrônico e histórico assistencial;
• Comunicação operacional com a unidade de saúde e entidade contratante;
• Cumprimento de obrigações legais e regulatórias.

O tratamento ocorre conforme a Lei nº 13.709/2018 (LGPD) e normas aplicáveis ao setor de saúde.$txt$,
    '1.0',
    'Jun/2026',
    true,
    ARRAY['admin', 'prefeitura', 'ubt', 'terminal'],
    12
  ),
  (
    'cadastro_permissao_notificacoes',
    'Permissão para receber notificações',
    $txt$[TEXTO DE TESTE — substituir posteriormente]

O titular autoriza o envio de notificações relacionadas ao serviço de saúde, incluindo:

• Confirmações e lembretes de consultas;
• Orientações pós-atendimento e retorno de exames, quando disponibilizados pelo serviço;
• Comunicados operacionais da unidade ou entidade contratante.

As notificações poderão ser enviadas por SMS, WhatsApp, e-mail ou outros canais informados no cadastro. O titular poderá solicitar ajustes nos canais de contato junto à unidade responsável.$txt$,
    '1.0',
    'Jun/2026',
    true,
    ARRAY['admin', 'prefeitura', 'ubt', 'terminal'],
    13
  )
ON CONFLICT (id) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  conteudo = EXCLUDED.conteudo,
  versao = EXCLUDED.versao,
  rotulo_atualizacao = EXCLUDED.rotulo_atualizacao,
  publicado = EXCLUDED.publicado,
  portais = EXCLUDED.portais,
  ordem = EXCLUDED.ordem;
