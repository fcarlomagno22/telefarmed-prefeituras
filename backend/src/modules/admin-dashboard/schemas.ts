import { z } from 'zod'

const NOC_TEAMS = [
  'NOC Plataforma',
  'Implantação',
  'Integrações',
  'Segurança da Informação',
  'Suporte N2',
] as const

export const adminDashboardOverviewQuerySchema = z.object({
  period: z.enum(['hoje', '7d', '30d']).default('hoje'),
  state: z.string().trim().default('all'),
  city: z.string().trim().default('all'),
  contract: z.enum(['all', 'active', 'expiring', 'suspended']).default('all'),
  health: z.enum(['all', 'green', 'yellow', 'red']).default('all'),
})

export const adminDashboardNocIncidentParamsSchema = z.object({
  id: z.string().uuid(),
})

export const adminDashboardNocIncidentPatchSchema = z
  .object({
    team: z.enum(NOC_TEAMS).optional(),
    assignee: z.string().trim().max(120).nullable().optional(),
    status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  })
  .refine((value) => value.team != null || value.assignee !== undefined || value.status != null, {
    message: 'Informe ao menos um campo para atualizar.',
  })
