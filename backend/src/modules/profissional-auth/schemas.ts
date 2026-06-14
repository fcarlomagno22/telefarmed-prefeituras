import { z } from 'zod'

const PROFISSIONAL_PASSWORD_RECOVERY_CODE_LENGTH = 8

export const loginBodySchema = z.object({
  cpf: z
    .string()
    .trim()
    .min(1, 'Informe o CPF.')
    .refine((value) => value.replace(/\D/g, '').length === 11, 'CPF inválido.'),
  password: z.string().trim().min(1, 'Informe a senha.'),
})

export const profissionalPasswordRecoveryRequestSchema = z.object({
  cpf: z.string().trim().min(11).max(14),
})

export const profissionalPasswordRecoveryVerifySchema = z.object({
  resetToken: z.string().trim().min(16).max(512),
  code: z
    .string()
    .trim()
    .min(PROFISSIONAL_PASSWORD_RECOVERY_CODE_LENGTH)
    .max(PROFISSIONAL_PASSWORD_RECOVERY_CODE_LENGTH + 8),
})

export const profissionalPasswordRecoveryCompleteSchema = z.object({
  verificationToken: z.string().trim().min(16).max(512),
  password: z.string().trim().min(8).max(128),
})
