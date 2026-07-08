import type { LegalAcceptances } from '../types/registrationTerms'
import type {
  AppLegalAcceptanceKey,
  AppRegistrationConsentTermsResponse,
  PatientRegistrationConsentTermsResponse,
} from '../types/registrationTerms'

export type RegisterLegalAgreement = {
  id: AppLegalAcceptanceKey
  title: string
  description: string
  fullContent: string
  version?: string
  updatedAtLabel?: string
  required: boolean
}

export const APP_LEGAL_ACCEPTANCE_ORDER: AppLegalAcceptanceKey[] = [
  'termsOfUse',
  'privacyPolicy',
  'lgpdConsent',
  'healthDataConsent',
  'communicationsConsent',
]

const FALLBACK_AGREEMENTS: RegisterLegalAgreement[] = [
  {
    id: 'termsOfUse',
    title: 'Termos de Uso',
    description: 'Concordo com as regras de utilização do app Telefarmed Sua Cidade.',
    fullContent: 'Concordo com as regras de utilização do app Telefarmed Sua Cidade.',
    required: true,
  },
  {
    id: 'privacyPolicy',
    title: 'Política de Privacidade',
    description: 'Li e aceito como meus dados pessoais são coletados, usados e armazenados.',
    fullContent: 'Li e aceito como meus dados pessoais são coletados, usados e armazenados.',
    required: true,
  },
  {
    id: 'lgpdConsent',
    title: 'Consentimento LGPD',
    description:
      'Autorizo o tratamento dos meus dados conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).',
    fullContent:
      'Autorizo o tratamento dos meus dados conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).',
    required: true,
  },
  {
    id: 'healthDataConsent',
    title: 'Dados sensíveis de saúde',
    description:
      'Autorizo o tratamento dos meus dados de saúde para fins de teleatendimento, prontuário e continuidade do cuidado.',
    fullContent:
      'Autorizo o tratamento dos meus dados de saúde para fins de teleatendimento, prontuário e continuidade do cuidado.',
    required: true,
  },
  {
    id: 'communicationsConsent',
    title: 'Comunicações do serviço',
    description:
      'Aceito receber avisos operacionais sobre consultas, agendamentos e atualizações do serviço.',
    fullContent:
      'Aceito receber avisos operacionais sobre consultas, agendamentos e atualizações do serviço.',
    required: true,
  },
]

export function summarizeRegistrationTermContent(content: string): string {
  const trimmed = content.trim()
  if (!trimmed) return ''

  const firstParagraph = trimmed.split(/\n\s*\n/)[0]?.trim() ?? trimmed
  if (firstParagraph.length <= 180) return firstParagraph

  return `${firstParagraph.slice(0, 177).trimEnd()}…`
}

function resolveHealthDataFullContent(
  appTerm: AppRegistrationConsentTermsResponse['terms']['healthDataConsent'],
  patientTerms: PatientRegistrationConsentTermsResponse | null,
): string {
  const sections = [appTerm.content.trim()]

  const secondaryDocumentId = appTerm.secondaryDocumentId?.trim()
  const patientSecondary = patientTerms?.terms.dataUsageAcknowledged

  if (
    secondaryDocumentId &&
    patientSecondary?.id === secondaryDocumentId &&
    patientSecondary.content.trim()
  ) {
    sections.push(patientSecondary.content.trim())
  }

  return sections.filter(Boolean).join('\n\n')
}

function mapAppTermToAgreement(
  term: AppRegistrationConsentTermsResponse['terms'][AppLegalAcceptanceKey],
  patientTerms: PatientRegistrationConsentTermsResponse | null,
): RegisterLegalAgreement {
  const fullContent =
    term.acceptanceKey === 'healthDataConsent'
      ? resolveHealthDataFullContent(term, patientTerms)
      : term.content.trim()

  return {
    id: term.acceptanceKey,
    title: term.title.trim(),
    description: summarizeRegistrationTermContent(fullContent),
    fullContent,
    version: term.version.trim(),
    updatedAtLabel: term.updatedAtLabel.trim(),
    required: true,
  }
}

export function buildRegisterLegalAgreements(
  appTerms: AppRegistrationConsentTermsResponse | null,
  patientTerms: PatientRegistrationConsentTermsResponse | null,
): RegisterLegalAgreement[] {
  if (!appTerms) return FALLBACK_AGREEMENTS

  return APP_LEGAL_ACCEPTANCE_ORDER.map((key) => {
    const term = appTerms.terms[key]
    if (!term) {
      return FALLBACK_AGREEMENTS.find((item) => item.id === key)!
    }

    return mapAppTermToAgreement(term, patientTerms)
  })
}

export function isLegalAcceptancesComplete(value: LegalAcceptances, agreements: RegisterLegalAgreement[]) {
  return agreements.filter((item) => item.required).every((item) => value[item.id])
}
