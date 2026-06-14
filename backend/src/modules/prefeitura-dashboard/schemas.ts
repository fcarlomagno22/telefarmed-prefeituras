import { z } from 'zod'

export const dashboardOverviewQuerySchema = z.object({
  period: z.enum(['hoje', '7d', '30d']).default('hoje'),
  regionKey: z.string().trim().default('todas'),
  unidadeUbtId: z.string().uuid().optional(),
})
