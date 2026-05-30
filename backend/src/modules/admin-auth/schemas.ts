import { z } from 'zod'

export const loginBodySchema = z.object({
  cpf: z.string().min(11).max(14),
  password: z.string().min(8).max(128),
})

export const verifyAdminPinBodySchema = z.object({
  pin: z.string().regex(/^\d{6}$/, 'PIN deve ter 6 dígitos.'),
})
