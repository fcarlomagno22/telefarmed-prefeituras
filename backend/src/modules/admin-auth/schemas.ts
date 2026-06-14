import { z } from 'zod'

const ADMIN_PASSWORD_RECOVERY_CODE_LENGTH = 8

export const loginBodySchema = z.object({
  cpf: z.string().min(11).max(14),
  password: z.string().min(8).max(128),
})

export const verifyAdminPinBodySchema = z.object({
  pin: z.string().regex(/^\d{6}$/, 'PIN deve ter 6 dígitos.'),
})

export const adminPasswordRecoveryRequestSchema = z.object({
  cpf: z.string().trim().min(11).max(14),
})

export const adminPasswordRecoveryVerifySchema = z.object({
  resetToken: z.string().trim().min(16).max(512),
  code: z
    .string()
    .trim()
    .min(ADMIN_PASSWORD_RECOVERY_CODE_LENGTH)
    .max(ADMIN_PASSWORD_RECOVERY_CODE_LENGTH + 8),
})

export const adminPasswordRecoveryCompleteSchema = z.object({
  verificationToken: z.string().trim().min(16).max(512),
  password: z.string().trim().min(8).max(128),
})
