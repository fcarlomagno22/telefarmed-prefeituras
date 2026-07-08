import { z } from 'zod'
import { isValidCpf } from '../../lib/cpf.js'

export const lookupCpfQuerySchema = z.object({
  cpf: z
    .string()
    .trim()
    .min(11, 'Informe o CPF.')
    .refine((value) => isValidCpf(value), { message: 'CPF inválido.' }),
  host: z.string().trim().optional(),
  slug: z.string().trim().optional(),
})
