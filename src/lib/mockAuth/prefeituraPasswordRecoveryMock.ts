import { adminOperatorsInitialRows } from '../../data/adminOperadoresMock'
import { isPortalPasswordValid } from '../../utils/passwordPolicy'
import { cpfDigits, isValidCpf } from '../../utils/cpf'
import { PREFEITURA_PASSWORD_RECOVERY_CODE_LENGTH } from '../../config/prefeituraPasswordRecovery'
import { MOCK_PREFEITURA_CPF } from './mockAuthCredentials'

const MOCK_RECOVERY_CODE = '12345678'
const MOCK_RECOVERY_PASSWORD = 'Tele@123'
const MOCK_DELAY_MS = 700

export class PrefeituraPasswordRecoveryError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PrefeituraPasswordRecoveryError'
    this.status = status
    this.code = code
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export type PrefeituraPasswordRecoveryRequestResult = {
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

const demoOperator =
  adminOperatorsInitialRows.find((row) => row.scope === 'Prefeitura') ??
  adminOperatorsInitialRows[0]

export async function mockPrefeituraRequestPasswordRecovery(
  cpf: string,
): Promise<PrefeituraPasswordRecoveryRequestResult> {
  await delay(MOCK_DELAY_MS)

  if (!isValidCpf(cpf)) {
    throw new PrefeituraPasswordRecoveryError('Informe um CPF válido.', 400, 'INVALID_CPF')
  }

  if (cpfDigits(cpf) !== cpfDigits(MOCK_PREFEITURA_CPF)) {
    throw new PrefeituraPasswordRecoveryError(
      'CPF não encontrado entre os usuários da prefeitura.',
      404,
      'CPF_NOT_FOUND',
    )
  }

  const demoEmail = demoOperator?.email ?? 'gestor@prefeitura.gov.br'

  return {
    resetToken: `mock-reset-${cpfDigits(cpf)}`,
    sentTo: maskEmail(demoEmail),
    expiresInMinutes: 15,
    sentAt: new Date().toISOString(),
  }
}

export async function mockPrefeituraVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}): Promise<{ verificationToken: string }> {
  await delay(MOCK_DELAY_MS)

  if (!input.resetToken.startsWith('mock-reset-')) {
    throw new PrefeituraPasswordRecoveryError(
      'Solicitação inválida ou expirada. Peça um novo código.',
      400,
      'INVALID_RESET_TOKEN',
    )
  }

  const normalizedCode = input.code.replace(/\D/g, '')
  if (
    normalizedCode.length !== PREFEITURA_PASSWORD_RECOVERY_CODE_LENGTH ||
    normalizedCode !== MOCK_RECOVERY_CODE
  ) {
    throw new PrefeituraPasswordRecoveryError('Código inválido ou expirado.', 400, 'INVALID_CODE')
  }

  return { verificationToken: `${input.resetToken}-verified` }
}

export async function mockPrefeituraCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}): Promise<void> {
  await delay(MOCK_DELAY_MS)

  if (!input.verificationToken.endsWith('-verified')) {
    throw new PrefeituraPasswordRecoveryError(
      'Não foi possível concluir a redefinição. Tente novamente.',
      400,
      'INVALID_VERIFICATION_TOKEN',
    )
  }

  if (!isPortalPasswordValid(input.password)) {
    throw new PrefeituraPasswordRecoveryError(
      'A nova senha não atende aos requisitos de segurança.',
      400,
      'WEAK_PASSWORD',
    )
  }
}

export const PREFEITURA_PASSWORD_RECOVERY_MOCK_HINT = {
  cpf: MOCK_PREFEITURA_CPF,
  code: MOCK_RECOVERY_CODE,
  password: MOCK_RECOVERY_PASSWORD,
}
