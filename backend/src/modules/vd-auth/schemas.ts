import { z } from 'zod'

const VD_PASSWORD_RECOVERY_CODE_LENGTH = 8

export const loginBodySchema = z.object({
  cpf: z.string().min(11).max(14),
  password: z.string().trim().min(6).max(128),
  tenantHost: z.string().trim().min(1).max(253).optional(),
})

export const vdPasswordRecoveryRequestSchema = z.object({
  cpf: z.string().trim().min(11).max(14),
  tenantHost: z.string().trim().min(1).max(253).optional(),
  slug: z.string().trim().optional(),
})

export const vdPasswordRecoveryVerifySchema = z.object({
  resetToken: z.string().trim().min(16).max(512),
  code: z
    .string()
    .trim()
    .min(VD_PASSWORD_RECOVERY_CODE_LENGTH)
    .max(VD_PASSWORD_RECOVERY_CODE_LENGTH + 8),
})

export const vdPasswordRecoveryCompleteSchema = z.object({
  verificationToken: z.string().trim().min(16).max(512),
  password: z.string().trim().min(8).max(128),
})
