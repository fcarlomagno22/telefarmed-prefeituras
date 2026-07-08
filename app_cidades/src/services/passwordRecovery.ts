import {
  completePasswordRecovery as apiCompletePasswordRecovery,
  requestPasswordRecovery as apiRequestPasswordRecovery,
  verifyPasswordRecoveryCode as apiVerifyPasswordRecoveryCode,
} from '../lib/api/vd'
import { VdApiError } from '../lib/api/vd/client'
import type {
  VdPasswordRecoveryRequestResult,
  VdPasswordRecoveryVerifyResult,
} from '../types/vdApi'

export type PasswordRecoveryRequestResult = VdPasswordRecoveryRequestResult
export type PasswordRecoveryVerifyResult = VdPasswordRecoveryVerifyResult

export class PasswordRecoveryError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PasswordRecoveryError'
    this.status = status
    this.code = code
  }
}

function toPasswordRecoveryError(error: unknown): PasswordRecoveryError {
  if (error instanceof PasswordRecoveryError) return error

  if (error instanceof VdApiError) {
    return new PasswordRecoveryError(error.message, error.status, error.code)
  }

  if (error instanceof Error && error.message.trim()) {
    return new PasswordRecoveryError(error.message, 0)
  }

  return new PasswordRecoveryError('Não foi possível concluir a operação.', 0)
}

async function wrapPasswordRecoveryCall<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call()
  } catch (error) {
    throw toPasswordRecoveryError(error)
  }
}

export async function requestPasswordRecovery(cpf: string): Promise<PasswordRecoveryRequestResult> {
  return wrapPasswordRecoveryCall(() => apiRequestPasswordRecovery(cpf))
}

export async function verifyPasswordRecoveryCode(input: {
  resetToken: string
  code: string
}): Promise<PasswordRecoveryVerifyResult> {
  return wrapPasswordRecoveryCall(() => apiVerifyPasswordRecoveryCode(input))
}

export async function completePasswordRecovery(input: {
  verificationToken: string
  password: string
}): Promise<void> {
  await wrapPasswordRecoveryCall(() => apiCompletePasswordRecovery(input))
}
