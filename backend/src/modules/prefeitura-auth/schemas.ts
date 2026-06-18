import { z } from 'zod'

const PREFEITURA_PASSWORD_RECOVERY_CODE_LENGTH = 8

export const loginBodySchema = z.object({
  cpf: z.string().min(11).max(14),
  password: z.string().trim().min(6).max(128),
  tenantHost: z.string().trim().min(1).max(253).optional(),
})

export const verifyPrefeituraPinBodySchema = z.object({
  pin: z.string().regex(/^\d{6}$/, 'PIN deve ter 6 dígitos.'),
})

export const prefeituraPasswordRecoveryRequestSchema = z.object({
  cpf: z.string().trim().min(11).max(14),
})

export const prefeituraPasswordRecoveryVerifySchema = z.object({
  resetToken: z.string().trim().min(16).max(512),
  code: z
    .string()
    .trim()
    .min(PREFEITURA_PASSWORD_RECOVERY_CODE_LENGTH)
    .max(PREFEITURA_PASSWORD_RECOVERY_CODE_LENGTH + 8),
})

export const prefeituraPasswordRecoveryCompleteSchema = z.object({
  verificationToken: z.string().trim().min(16).max(512),
  password: z.string().trim().min(8).max(128),
})
