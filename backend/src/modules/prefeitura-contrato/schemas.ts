import { z } from 'zod'

export const cycleUsageQuerySchema = z.object({
  unidadeUbtId: z.string().uuid().optional(),
  regionKey: z.string().trim().optional(),
})

export const contratoIdParamSchema = z.object({
  id: z.string().uuid(),
})

export const contratoMonthParamSchema = z.object({
  id: z.string().uuid(),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
})
