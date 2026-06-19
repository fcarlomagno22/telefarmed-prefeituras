import type {
  PatientRegistrationConsentTermsCatalog,
  PatientRegistrationConsentTermsResponse,
} from '../../types/patientRegistrationConsentTerms'

const mockPatientRegistrationConsentTerms: PatientRegistrationConsentTermsCatalog = {
  dataReviewed: {
    id: 'cadastro_conferencia_dados',
    title: 'Confirmação de conferência dos dados cadastrais',
    content: `[TEXTO DE TESTE — substituir posteriormente]

Ao marcar esta opção, o operador responsável pelo cadastro declara que conferiu, junto ao paciente ou responsável legal, os dados pessoais, documentos e informações de contato informados neste formulário.

A conferência inclui, quando aplicável: nome completo, CPF, CNS, data de nascimento, sexo, nacionalidade, raça/cor, endereço, telefones, e-mail e dados do responsável legal.

Eventuais correções devem ser feitas antes da conclusão do cadastro.`,
    version: '1.0',
    updatedAtLabel: 'Jun/2026',
  },
  teleconsultationAuthorized: {
    id: 'cadastro_autorizacao_teleconsulta',
    title: 'Autorização para atendimento por teleconsulta',
    content: `[TEXTO DE TESTE — substituir posteriormente]

O paciente (ou responsável legal, quando aplicável) autoriza a realização de atendimentos de saúde por teleconsulta, nos termos da regulamentação vigente.

Está ciente de que a teleconsulta possui limitações próprias do meio digital e que situações de urgência ou emergência exigem atendimento presencial imediato.

A autorização abrange consultas, orientações, encaminhamentos e demais procedimentos clínicos realizados remotamente pela rede contratada.`,
    version: '1.0',
    updatedAtLabel: 'Jun/2026',
  },
  dataUsageAcknowledged: {
    id: 'cadastro_ciencia_dados',
    title: 'Ciência sobre uso de dados para assistência e registros administrativos',
    content: `[TEXTO DE TESTE — substituir posteriormente]

O titular dos dados (ou responsável legal) declara ciência de que suas informações pessoais e de saúde serão utilizadas para:

• Prestação do serviço de teleatendimento e continuidade do cuidado;
• Registro em prontuário eletrônico e histórico assistencial;
• Comunicação operacional com a unidade de saúde e entidade contratante;
• Cumprimento de obrigações legais e regulatórias.

O tratamento ocorre conforme a Lei nº 13.709/2018 (LGPD) e normas aplicáveis ao setor de saúde.`,
    version: '1.0',
    updatedAtLabel: 'Jun/2026',
  },
  notificationsAllowed: {
    id: 'cadastro_permissao_notificacoes',
    title: 'Permissão para receber notificações',
    content: `[TEXTO DE TESTE — substituir posteriormente]

O titular autoriza o envio de notificações relacionadas ao serviço de saúde, incluindo:

• Confirmações e lembretes de consultas;
• Orientações pós-atendimento e retorno de exames, quando disponibilizados pelo serviço;
• Comunicados operacionais da unidade ou entidade contratante.

As notificações poderão ser enviadas por SMS, WhatsApp, e-mail ou outros canais informados no cadastro. O titular poderá solicitar ajustes nos canais de contato junto à unidade responsável.`,
    version: '1.0',
    updatedAtLabel: 'Jun/2026',
  },
}

export async function fetchPatientRegistrationConsentTerms(): Promise<PatientRegistrationConsentTermsResponse> {
  await new Promise((resolve) => window.setTimeout(resolve, 120))
  return { terms: mockPatientRegistrationConsentTerms }
}
