import { z } from 'zod'

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const weekQuerySchema = z.object({
  weekStart: isoDateSchema,
  weekEnd: isoDateSchema,
  unidadeUbtId: z.string().uuid().optional(),
})

export const dayQuerySchema = z.object({
  date: isoDateSchema,
  unidadeUbtId: z.string().uuid(),
})

export const futureQuerySchema = z.object({
  period: z.enum(['7d', '30d']),
  unidadeUbtId: z.string().uuid().optional(),
})
