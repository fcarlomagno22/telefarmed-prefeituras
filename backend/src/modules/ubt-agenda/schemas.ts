import { z } from 'zod'

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
const horaSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido.')

export const dateQuerySchema = z.object({
  date: isoDateSchema,
})

export const dateRangeQuerySchema = z.object({
  from: isoDateSchema,
  to: isoDateSchema,
})

export const monthIndicatorsQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
})

export const historyQuerySchema = z.object({
  date: isoDateSchema,
  count: z.coerce.number().int().min(1).max(14).optional().default(3),
})

export const medicosQuerySchema = z.object({
  specialtyId: z.string().min(1).optional(),
  date: isoDateSchema.optional(),
})

export const doctorSlotsQuerySchema = z.object({
  date: isoDateSchema,
})

export const doctorOverviewQuerySchema = z.object({
  from: isoDateSchema,
  days: z.coerce.number().int().min(1).max(62).optional().default(31),
})

export const specialtySlotCountParamsSchema = z.object({
  id: z.string().min(1),
})

export const specialtySlotCountQuerySchema = z.object({
  date: isoDateSchema,
})

export const specialtyAvailabilityQuerySchema = z.object({
  date: isoDateSchema,
})

export const consultaIdParamsSchema = z.object({
  id: z.string().uuid('ID inválido.'),
})

export const createConsultaBodySchema = z.object({
  pacienteId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  especialidadeId: z.string().min(1),
  data: isoDateSchema,
  hora: horaSchema,
  escalaSlotId: z.string().uuid().optional(),
  telefoneContato: z.string().max(30).optional(),
  observacoes: z.string().max(2000).optional(),
  tipo: z.enum(['consulta', 'retorno']).optional().default('consulta'),
})

export const updateConsultaBodySchema = z
  .object({
    profissionalId: z.string().uuid().optional(),
    especialidadeId: z.string().min(1).optional(),
    data: isoDateSchema.optional(),
    hora: horaSchema.optional(),
    telefoneContato: z.string().max(30).optional(),
    observacoes: z.string().max(2000).optional(),
    status: z
      .enum(['agendado', 'aguardando', 'em_atendimento', 'realizado', 'faltou'])
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar.',
  })

export const walkInBodySchema = z.object({
  pacienteId: z.string().uuid(),
  especialidadeId: z.string().min(1),
  profissionalId: z.string().uuid(),
  hora: horaSchema,
  telefoneContato: z.string().max(30).optional(),
  observacoes: z.string().max(2000).optional(),
})

export type CreateConsultaBody = z.infer<typeof createConsultaBodySchema>
export type UpdateConsultaBody = z.infer<typeof updateConsultaBodySchema>
export type WalkInBody = z.infer<typeof walkInBodySchema>
