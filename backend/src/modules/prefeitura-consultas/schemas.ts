import { z } from 'zod'

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const overviewQuerySchema = z.object({
  periodStart: isoDateSchema,
  periodEnd: isoDateSchema,
  unidadeUbtId: z.string().uuid().optional(),
  regionKey: z.string().trim().optional(),
})

export const unitDetailQuerySchema = z.object({
  periodStart: isoDateSchema,
  periodEnd: isoDateSchema,
})

export const unitIdParamSchema = z.object({
  unitId: z.string().uuid(),
})
