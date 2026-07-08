import { isValidCpf } from './cpf.js'
import {
  CONSENTIMENTO_CANAL_APP_VD,
  SELF_SERVICE_OPERATOR_NAME_DEFAULT,
} from './patientRegistrationAppConsent.js'

export type PatientCompletenessRow = {
  data_nascimento?: string | null
  cpf: string
  cns?: string | null
  cns_pendente: boolean
  nacionalidade?: string | null
  raca_cor?: string | null
  telefone?: string | null
  email?: string | null
  sexo?: string | null
  contato_emergencia?: unknown
  endereco?: Record<string, unknown> | null
}

function readEnderecoField(endereco: Record<string, unknown> | null | undefined, key: string): string {
  if (!endereco) return ''
  const value = endereco[key]
  return typeof value === 'string' ? value : ''
}

function readContacts(contatoEmergencia: unknown): Array<{ name: string; phone: string }> {
  if (!Array.isArray(contatoEmergencia)) return []
  return contatoEmergencia
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      name: String(item.name ?? item.nome ?? '').trim(),
      phone: String(item.phone ?? item.telefone ?? '').trim(),
    }))
    .filter((item) => item.name || item.phone)
}

/** Campos clínicos obrigatórios para cadastro completo (UBT/admin). */
export function computePatientMissingFields(row: PatientCompletenessRow): string[] {
  const missing: string[] = []
  if (!row.data_nascimento?.trim()) missing.push('data de nascimento')

  const cpfDigits = row.cpf.replace(/\D/g, '')
  const hasValidCpf = cpfDigits.length === 11 && isValidCpf(cpfDigits)
  if (row.cns_pendente || (!hasValidCpf && !row.cns?.trim())) {
    missing.push('CNS')
  }

  const sexo = row.sexo?.trim().toLowerCase() ?? ''
  if (!sexo || sexo === 'nao_informado') missing.push('gênero')

  if (!row.nacionalidade?.trim()) missing.push('nacionalidade')
  if (!row.raca_cor?.trim()) missing.push('raça/cor')
  if (!row.telefone?.trim()) missing.push('telefone')
  if (!row.email?.trim()) missing.push('e-mail')

  const contacts = readContacts(row.contato_emergencia)
  if (!contacts.some((contact) => contact.name && contact.phone)) {
    missing.push('contato de emergência')
  }

  if (!readEnderecoField(row.endereco ?? null, 'cep')) missing.push('CEP')

  return missing
}

/** Consentimento self-service (app) exige aceite presencial com operador UBT. */
export function consentimentoRequiresUbtOperatorCompletion(
  consentimento: Record<string, unknown> | null | undefined,
): boolean {
  if (!consentimento || Object.keys(consentimento).length === 0) return true
  if (consentimento.canal === CONSENTIMENTO_CANAL_APP_VD) return true

  const operador = String(consentimento.operador_nome ?? '').trim()
  if (operador === SELF_SERVICE_OPERATOR_NAME_DEFAULT) return true

  return false
}

export type UbtFirstVisitIncompletenessMeta = {
  consentimento_cadastro?: Record<string, unknown> | null
}

export function isPatientIncompleteForUbtFirstVisit(
  patient: {
    dataQuality: 'complete' | 'incomplete'
    missingFields: string[]
    avatarUrl?: string
  },
  meta?: UbtFirstVisitIncompletenessMeta,
): boolean {
  if (patient.dataQuality === 'incomplete') return true
  if (patient.missingFields.length > 0) return true
  if (!patient.avatarUrl?.trim()) return true
  if (consentimentoRequiresUbtOperatorCompletion(meta?.consentimento_cadastro)) return true
  return false
}

/** Defaults quando lookup incompleto ocorre sem especialidade agendada (ex.: fila). */
export const UBT_INCOMPLETE_REGISTRATION_SPECIALTY = {
  id: 'cadastro-incompleto',
  name: 'Completar cadastro',
} as const
