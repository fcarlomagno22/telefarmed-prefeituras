import { z } from 'zod'
import { isValidCepDigits, normalizeCepDigits } from '../../lib/viacep.js'

export const elegibilidadeCepQuerySchema = z.object({
  cep: z
    .string()
    .trim()
    .min(1, 'Informe o CEP.')
    .refine((value) => isValidCepDigits(normalizeCepDigits(value)), {
      message: 'Informe um CEP válido com 8 dígitos.',
    }),
  cidade: z.string().trim().optional(),
  uf: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value.toUpperCase() : value))
    .refine((value) => !value || value.length === 2, {
      message: 'Informe a UF com 2 letras.',
    }),
  host: z.string().trim().optional(),
  slug: z.string().trim().optional(),
})
