import { z } from 'zod'

export const loginBodySchema = z.object({
  cpf: z.string().min(11).max(14),
  password: z.string().trim().min(6).max(128),
})

export const verifyPrefeituraPinBodySchema = z.object({
  pin: z.string().regex(/^\d{6}$/, 'PIN deve ter 6 dígitos.'),
})
