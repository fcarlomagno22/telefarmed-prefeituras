import { z } from 'zod'

export const monitorOverviewQuerySchema = z.object({
  regionKey: z.string().trim().default('todas'),
  timelinePeriod: z.enum(['hoje', 'ontem', 'semana']).default('hoje'),
})

export const monitorRankingQuerySchema = z.object({
  tab: z.enum(['produtividade', 'abandono', 'espera', 'avaliacao']),
  regionKey: z.string().trim().default('todas'),
  timelinePeriod: z.enum(['hoje', 'ontem', 'semana']).default('hoje'),
})

export const monitorStreamQuerySchema = z.object({
  regionKey: z.string().trim().default('todas'),
})
