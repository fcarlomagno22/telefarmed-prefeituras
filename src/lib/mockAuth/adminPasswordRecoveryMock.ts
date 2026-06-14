import { adminInternoCredentialsInitial } from '../../data/adminCredenciaisMock'
import { isPortalPasswordValid } from '../../utils/passwordPolicy'
import { cpfDigits, isValidCpf } from '../../utils/cpf'
import { ADMIN_PASSWORD_RECOVERY_CODE_LENGTH } from '../../config/adminPasswordRecovery'
import { MOCK_ADMIN_CPF } from './mockAuthCredentials'

const MOCK_RECOVERY_CODE = '12345678'
const MOCK_RECOVERY_PASSWORD = 'Tele@123'
const MOCK_DELAY_MS = 700

export class AdminPasswordRecoveryError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminPasswordRecoveryError'
    this.status = status
    this.code = code
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export type AdminPasswordRecoveryRequestResult = {
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

export async function mockAdminRequestPasswordRecovery(
  cpf: string,
): Promise<AdminPasswordRecoveryRequestResult> {
  await delay(MOCK_DELAY_MS)

  if (!isValidCpf(cpf)) {
    throw new AdminPasswordRecoveryError('Informe um CPF válido.', 400, 'INVALID_CPF')
  }

  if (cpfDigits(cpf) !== cpfDigits(MOCK_ADMIN_CPF)) {
    throw new AdminPasswordRecoveryError(
      'CPF não encontrado entre os usuários administrativos.',
      404,
      'CPF_NOT_FOUND',
    )
  }

  const demoEmail = adminInternoCredentialsInitial[0]?.email ?? 'admin@telefarmed.com.br'

  return {
    resetToken: `mock-reset-${cpfDigits(cpf)}`,
    sentTo: maskEmail(demoEmail),
    expiresInMinutes: 15,
    sentAt: new Date().toISOString(),
  }
}

export async function mockAdminVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}): Promise<{ verificationToken: string }> {
  await delay(MOCK_DELAY_MS)

  if (!input.resetToken.startsWith('mock-reset-')) {
    throw new AdminPasswordRecoveryError(
      'Solicitação inválida ou expirada. Peça um novo código.',
      400,
      'INVALID_RESET_TOKEN',
    )
  }

  const normalizedCode = input.code.replace(/\D/g, '')
  if (
    normalizedCode.length !== ADMIN_PASSWORD_RECOVERY_CODE_LENGTH ||
    normalizedCode !== MOCK_RECOVERY_CODE
  ) {
    throw new AdminPasswordRecoveryError('Código inválido ou expirado.', 400, 'INVALID_CODE')
  }

  return { verificationToken: `${input.resetToken}-verified` }
}

export async function mockAdminCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}): Promise<void> {
  await delay(MOCK_DELAY_MS)

  if (!input.verificationToken.endsWith('-verified')) {
    throw new AdminPasswordRecoveryError(
      'Não foi possível concluir a redefinição. Tente novamente.',
      400,
      'INVALID_VERIFICATION_TOKEN',
    )
  }

  if (!isPortalPasswordValid(input.password)) {
    throw new AdminPasswordRecoveryError(
      'A nova senha não atende aos requisitos de segurança.',
      400,
      'WEAK_PASSWORD',
    )
  }
}

export const ADMIN_PASSWORD_RECOVERY_MOCK_HINT = {
  cpf: MOCK_ADMIN_CPF,
  code: MOCK_RECOVERY_CODE,
  password: MOCK_RECOVERY_PASSWORD,
}
