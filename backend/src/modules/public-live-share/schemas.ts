import { z } from 'zod'

export const liveShareTokenParamSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
  .refine((value) => value.length >= 6 && value.length <= 12, {
    message: 'Token inválido.',
  })
