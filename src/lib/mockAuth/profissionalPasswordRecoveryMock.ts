import { profissionalLoggedProfile } from '../../data/profissionalPerfilMock'
import { isPortalPasswordValid } from '../../utils/passwordPolicy'
import { cpfDigits, isValidCpf } from '../../utils/cpf'
import { PROFISSIONAL_PASSWORD_RECOVERY_CODE_LENGTH } from '../../config/profissionalPasswordRecovery'
import { MOCK_PROFISSIONAL_CPF } from './mockAuthCredentials'

const MOCK_RECOVERY_CODE = '12345678'
const MOCK_RECOVERY_PASSWORD = 'Tele@123'
const MOCK_DELAY_MS = 700

export class ProfissionalPasswordRecoveryError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ProfissionalPasswordRecoveryError'
    this.status = status
    this.code = code
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export type ProfissionalPasswordRecoveryRequestResult = {
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

export async function mockProfissionalRequestPasswordRecovery(
  cpf: string,
): Promise<ProfissionalPasswordRecoveryRequestResult> {
  await delay(MOCK_DELAY_MS)

  if (!isValidCpf(cpf)) {
    throw new ProfissionalPasswordRecoveryError('Informe um CPF válido.', 400, 'INVALID_CPF')
  }

  if (cpfDigits(cpf) !== cpfDigits(MOCK_PROFISSIONAL_CPF)) {
    throw new ProfissionalPasswordRecoveryError(
      'CPF não encontrado entre os profissionais da rede.',
      404,
      'CPF_NOT_FOUND',
    )
  }

  return {
    resetToken: `mock-reset-${cpfDigits(cpf)}`,
    sentTo: maskEmail(profissionalLoggedProfile.email),
    expiresInMinutes: 15,
    sentAt: new Date().toISOString(),
  }
}

export async function mockProfissionalVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}): Promise<{ verificationToken: string }> {
  await delay(MOCK_DELAY_MS)

  if (!input.resetToken.startsWith('mock-reset-')) {
    throw new ProfissionalPasswordRecoveryError(
      'Solicitação inválida ou expirada. Peça um novo código.',
      400,
      'INVALID_RESET_TOKEN',
    )
  }

  const normalizedCode = input.code.replace(/\D/g, '')
  if (
    normalizedCode.length !== PROFISSIONAL_PASSWORD_RECOVERY_CODE_LENGTH ||
    normalizedCode !== MOCK_RECOVERY_CODE
  ) {
    throw new ProfissionalPasswordRecoveryError('Código inválido ou expirado.', 400, 'INVALID_CODE')
  }

  return { verificationToken: `${input.resetToken}-verified` }
}

export async function mockProfissionalCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}): Promise<void> {
  await delay(MOCK_DELAY_MS)

  if (!input.verificationToken.endsWith('-verified')) {
    throw new ProfissionalPasswordRecoveryError(
      'Não foi possível concluir a redefinição. Tente novamente.',
      400,
      'INVALID_VERIFICATION_TOKEN',
    )
  }

  if (!isPortalPasswordValid(input.password)) {
    throw new ProfissionalPasswordRecoveryError(
      'A nova senha não atende aos requisitos de segurança.',
      400,
      'WEAK_PASSWORD',
    )
  }
}

export const PROFISSIONAL_PASSWORD_RECOVERY_MOCK_HINT = {
  cpf: MOCK_PROFISSIONAL_CPF,
  code: MOCK_RECOVERY_CODE,
  password: MOCK_RECOVERY_PASSWORD,
}
