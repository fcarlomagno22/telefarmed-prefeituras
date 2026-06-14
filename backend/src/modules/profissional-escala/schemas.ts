import { z } from 'zod'

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')

export const slotIdParamSchema = z.object({
  slotId: z.string().uuid('ID do plantão inválido.'),
})

export const inscricaoIdParamSchema = z.object({
  inscricaoId: z.string().uuid('ID da inscrição inválido.'),
})

export const plantaoIdParamSchema = z.object({
  plantaoId: z.string().uuid('ID do plantão confirmado inválido.'),
})

export const listDisponiveisQuerySchema = z.object({
  dateFrom: dateKeySchema.optional(),
  dateTo: dateKeySchema.optional(),
})

export type ListDisponiveisQuery = z.infer<typeof listDisponiveisQuerySchema>
