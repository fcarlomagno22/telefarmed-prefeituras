import { z } from 'zod'

const vitalFieldSchema = z.object({
  value: z.number().nullable(),
  notMeasured: z.boolean(),
})

export const posConsultaCheckinRespostasSchema = z.object({
  evolucaoComparacao: z.enum(['melhorou', 'igual', 'piorou']).nullable(),
  intensidadeSintoma: z.number().int().min(0).max(10).nullable(),
  medicacaoAdesao: z.enum(['sim', 'parcial', 'nao']).nullable(),
  medicacaoAdesaoMotivo: z.string().max(500).default(''),
  bloodPressureSystolic: vitalFieldSchema,
  bloodPressureDiastolic: vitalFieldSchema,
  bloodGlucose: vitalFieldSchema,
  alertSigns: z.object({
    dispneia: z.boolean(),
    dor_toracica: z.boolean(),
    febre_persistente: z.boolean(),
    sangramento: z.boolean(),
    confusao_mental: z.boolean(),
  }),
})

export const posConsultaTokenParamSchema = z.object({
  token: z.string().trim().min(16).max(128),
})

export const profissionalHistoricoParamsSchema = z.object({
  pacienteId: z.string().uuid(),
})

export const profissionalHistoricoQuerySchema = z.object({
  specialty: z.string().trim().min(1).max(120),
})

export const prefeituraPosConsultaMetricsQuerySchema = z.object({
  period: z.enum(['hoje', '7d', '30d']).default('30d'),
  regionKey: z.string().trim().default('todas'),
  unidadeUbtId: z.string().uuid().optional(),
})

export const adminPosConsultaMetricsQuerySchema = z.object({
  period: z.enum(['hoje', '7d', '30d']).default('30d'),
  state: z.string().trim().default('all'),
  city: z.string().trim().default('all'),
  contract: z.enum(['all', 'active', 'expiring', 'suspended']).default('all'),
})

export type PosConsultaCheckinRespostasInput = z.infer<typeof posConsultaCheckinRespostasSchema>
