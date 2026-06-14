import { z } from 'zod'

export const unitIdParamSchema = z.object({
  unitId: z.string().uuid('ID da unidade inválido.'),
})

const addressSchema = z.object({
  cep: z.string().max(16).optional(),
  street: z.string().max(200).optional(),
  number: z.string().max(32).optional(),
  complement: z.string().max(120).optional(),
  neighborhood: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(2).optional(),
})

export const createUnitBodySchema = z.object({
  name: z.string().trim().min(2).max(200),
  cnes: z.string().trim().max(20).optional(),
  unitType: z.enum(['fixa', 'movel']),
  status: z.enum(['ativa', 'manutencao', 'inativa']),
  regionKey: z.string().trim().min(1).max(64),
  regionLabel: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(32).optional(),
  dailyCapacity: z.number().int().min(0).max(100_000).optional(),
  specialties: z.array(z.string().trim().min(1).max(64)).max(64).optional(),
  notes: z.string().max(4000).optional(),
  stationsTotal: z.number().int().min(1).max(64),
  address: addressSchema.optional(),
})

const responsibleBodySchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: 'E-mail inválido.',
    }),
  cpf: z.string().trim().max(14).optional(),
})

export const updateUnitBodySchema = createUnitBodySchema.partial().extend({
  maintenanceTerminalIndexes: z.array(z.number().int().min(0).max(63)).max(64).optional(),
  responsible: responsibleBodySchema.optional(),
})

export const notifyUnitBodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
  recipientScope: z.enum(['ubt', 'responsible', 'operators']).default('ubt'),
  priority: z.enum(['normal', 'important']).optional(),
})

export const maintenanceBodySchema = z.object({
  items: z
    .array(
      z.object({
        unitId: z.string().uuid(),
        terminalIndexes: z.array(z.number().int().min(0).max(63)).max(64),
      }),
    )
    .min(1)
    .max(500),
})

export const settingsBodySchema = z.object({
  limitDailyCapacity: z.boolean(),
  dailyCapacity: z.number().int().min(0).max(1_000_000),
  limitPerUnit: z.boolean(),
  unitDailyLimits: z.record(z.string().uuid(), z.string().regex(/^\d+$/)).optional(),
  unitSpecialties: z.record(z.string().uuid(), z.array(z.string().trim().min(1).max(64))).optional(),
  allowAvulso: z.boolean(),
})

export type CreateUnitBody = z.infer<typeof createUnitBodySchema>
export type UpdateUnitBody = z.infer<typeof updateUnitBodySchema>
export type NotifyUnitBody = z.infer<typeof notifyUnitBodySchema>
export type MaintenanceBody = z.infer<typeof maintenanceBodySchema>
export type SettingsBody = z.infer<typeof settingsBodySchema>
