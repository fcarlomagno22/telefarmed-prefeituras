import { PASSWORD_RECOVERY_CODE_LENGTH } from '../config/passwordRecovery'
import { cpfDigits, isValidCpf } from '../utils/cpf'
import { isPasswordValid } from '../utils/password'

const MOCK_RECOVERY_CODE = '12345678'
const MOCK_DELAY_MS = 800

export class PasswordRecoveryError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'PasswordRecoveryError'
    this.status = status
  }
}

export type PasswordRecoveryRequestResult = {
  resetToken: string
  sentTo: string
  expiresInMinutes: number
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function maskEmail(cpf: string) {
  const digits = cpfDigits(cpf).slice(-4)
  return `us****${digits}@email.com`
}

export async function mockRequestPasswordRecovery(
  cpf: string,
): Promise<PasswordRecoveryRequestResult> {
  await delay(MOCK_DELAY_MS)

  if (!isValidCpf(cpf)) {
    throw new PasswordRecoveryError('Informe um CPF válido.', 400)
  }

  return {
    resetToken: `mock-reset-${cpfDigits(cpf)}`,
    sentTo: maskEmail(cpf),
    expiresInMinutes: 15,
  }
}

export async function mockVerifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}): Promise<{ verificationToken: string }> {
  await delay(MOCK_DELAY_MS)

  if (!input.resetToken.startsWith('mock-reset-')) {
    throw new PasswordRecoveryError(
      'Solicitação inválida ou expirada. Peça um novo código.',
      400,
    )
  }

  const normalizedCode = input.code.replace(/\D/g, '')
  if (
    normalizedCode.length !== PASSWORD_RECOVERY_CODE_LENGTH ||
    normalizedCode !== MOCK_RECOVERY_CODE
  ) {
    throw new PasswordRecoveryError('Código inválido ou expirado.', 400)
  }

  return { verificationToken: `${input.resetToken}-verified` }
}

export async function mockCompletePasswordRecovery(input: {
  verificationToken: string
  password: string
}): Promise<void> {
  await delay(MOCK_DELAY_MS)

  if (!input.verificationToken.endsWith('-verified')) {
    throw new PasswordRecoveryError(
      'Não foi possível concluir a redefinição. Tente novamente.',
      400,
    )
  }

  if (!isPasswordValid(input.password)) {
    throw new PasswordRecoveryError(
      'A nova senha não atende aos requisitos de segurança.',
      400,
    )
  }
}
