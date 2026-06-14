import { z } from 'zod'

const UBT_PASSWORD_RECOVERY_CODE_LENGTH = 8

export const loginBodySchema = z.object({
  cpf: z.string().trim().min(11).max(14),
  password: z.string().trim().min(6).max(128),
})

export const verifyUbtPinBodySchema = z.object({
  pin: z.string().regex(/^\d{6}$/, 'PIN deve ter 6 dígitos.'),
})

export const ubtPasswordRecoveryRequestSchema = z.object({
  cpf: z.string().trim().min(11).max(14),
})

export const ubtPasswordRecoveryVerifySchema = z.object({
  resetToken: z.string().trim().min(16).max(512),
  code: z.string().trim().min(UBT_PASSWORD_RECOVERY_CODE_LENGTH).max(UBT_PASSWORD_RECOVERY_CODE_LENGTH + 8),
})

export const ubtPasswordRecoveryCompleteSchema = z.object({
  verificationToken: z.string().trim().min(16).max(512),
  password: z.string().trim().min(8).max(128),
})
