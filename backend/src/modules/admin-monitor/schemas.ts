import { z } from 'zod'

export const adminMonitorOverviewQuerySchema = z.object({
  entidadeId: z.string().trim().default('all'),
  regionKey: z.string().trim().default('todos'),
  timelinePeriod: z
    .enum(['dia', '24h', '7d', 'hoje', 'ontem', 'semana'])
    .default('dia'),
})

export const adminMonitorStreamQuerySchema = z.object({
  entidadeId: z.string().trim().default('all'),
  regionKey: z.string().trim().default('todos'),
  accessToken: z.string().trim().optional(),
})
