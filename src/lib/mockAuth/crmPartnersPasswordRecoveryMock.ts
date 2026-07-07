import { CRM_PARTNERS_PASSWORD_RECOVERY_CODE_LENGTH } from '../../config/crmPartnersPasswordRecovery'
import { isPortalPasswordValid } from '../../utils/passwordPolicy'
import { cpfDigits, isValidCpf } from '../../utils/cpf'
import { MOCK_AUTH_CPF } from './mockAuthCredentials'
const MOCK_RECOVERY_CODE = '12345678'
const MOCK_RECOVERY_PASSWORD = 'Tele@123'
const MOCK_DELAY_MS = 700
const MOCK_PARTNER_EMAIL = 'parceiro@telefarmed.com.br'

export class CrmPartnersPasswordRecoveryError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'CrmPartnersPasswordRecoveryError'
    this.status = status
    this.code = code
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export type CrmPartnersPasswordRecoveryRequestResult = {
  resetToken: string
  sentTo: string
  expiresInMinutes: number
  sentAt: string
}

function maskEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  const [local, domain] = normalized.split('@')
  if (!local || !domain) return normalized
  if (local.length <= 2) return `${local[0] ?? '*'}***@${domain}`
  return `${local.slice(0, 2)}${'*'.repeat(Math.min(local.length - 2, 4))}@${domain}`
}

export async function mockCrmPartnersRequestPasswordRecovery(
  cpf: string,
): Promise<CrmPartnersPasswordRecoveryRequestResult> {
  await delay(MOCK_DELAY_MS)

  if (!isValidCpf(cpf)) {
    throw new CrmPartnersPasswordRecoveryError('Informe um CPF válido.', 400, 'INVALID_CPF')
  }

  if (cpfDigits(cpf) !== cpfDigits(MOCK_AUTH_CPF)) {
    throw new CrmPartnersPasswordRecoveryError(
      'CPF não encontrado entre os parceiros cadastrados.',
      404,
      'CPF_NOT_FOUND',
    )
  }

  return {
    resetToken: `mock-reset-${cpfDigits(cpf)}`,
    sentTo: maskEmail(MOCK_PARTNER_EMAIL),
    expiresInMinutes: 15,
    sentAt: new Date().toISOString(),
  }
}

export async function mockCrmPartnersVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}): Promise<{ verificationToken: string }> {
  await delay(MOCK_DELAY_MS)

  if (!input.resetToken.startsWith('mock-reset-')) {
    throw new CrmPartnersPasswordRecoveryError(
      'Solicitação inválida ou expirada. Peça um novo código.',
      400,
      'INVALID_RESET_TOKEN',
    )
  }

  const normalizedCode = input.code.replace(/\D/g, '')
  if (
    normalizedCode.length !== CRM_PARTNERS_PASSWORD_RECOVERY_CODE_LENGTH ||
    normalizedCode !== MOCK_RECOVERY_CODE
  ) {
    throw new CrmPartnersPasswordRecoveryError('Código inválido ou expirado.', 400, 'INVALID_CODE')
  }

  return { verificationToken: `${input.resetToken}-verified` }
}

export async function mockCrmPartnersCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}): Promise<void> {
  await delay(MOCK_DELAY_MS)

  if (!input.verificationToken.endsWith('-verified')) {
    throw new CrmPartnersPasswordRecoveryError(
      'Não foi possível concluir a redefinição. Tente novamente.',
      400,
      'INVALID_VERIFICATION_TOKEN',
    )
  }

  if (!isPortalPasswordValid(input.password)) {
    throw new CrmPartnersPasswordRecoveryError(
      'A nova senha não atende aos requisitos de segurança.',
      400,
      'WEAK_PASSWORD',
    )
  }
}

export const CRM_PARTNERS_PASSWORD_RECOVERY_MOCK_HINT = {
  cpf: MOCK_AUTH_CPF,
  code: MOCK_RECOVERY_CODE,
  password: MOCK_RECOVERY_PASSWORD,
}
