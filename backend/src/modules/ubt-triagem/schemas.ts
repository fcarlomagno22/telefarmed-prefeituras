import { z } from 'zod'

export const checkInBodySchema = z.object({
  agendaConsultaId: z.string().uuid(),
})

export const filaStatusUpdateBodySchema = z.object({
  status: z.enum(['em_atendimento', 'finalizado', 'desistiu']),
})

export const filaIdParamsSchema = z.object({
  id: z.string().uuid(),
})

export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
