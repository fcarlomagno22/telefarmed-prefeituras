import { z } from 'zod'

const competenceSchema = z
  .string()
  .regex(/^[0-9]{4}-(0[1-9]|1[0-2])$/, 'Competência inválida. Use YYYY-MM.')

export const listRepassesQuerySchema = z.object({
  competenciaFrom: competenceSchema.optional(),
  competenciaTo: competenceSchema.optional(),
  status: z.enum(['pendente', 'processando', 'pago']).optional(),
  limit: z.coerce.number().int().min(1).max(120).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

export const competenciaParamSchema = z.object({
  competencia: competenceSchema,
})

export const updateDadosPagamentoBodySchema = z.object({
  pixTipo: z.string().trim().min(1).max(32).optional(),
  pixChave: z.string().trim().min(1).max(256).optional(),
  bancoNome: z.string().trim().max(120).optional(),
  bancoCodigo: z.string().trim().max(16).optional(),
  agencia: z.string().trim().max(16).optional(),
  conta: z.string().trim().max(32).optional(),
  tipoConta: z.string().trim().max(32).optional(),
  titular: z.string().trim().max(160).optional(),
})

export type ListRepassesQuery = z.infer<typeof listRepassesQuerySchema>
export type UpdateDadosPagamentoBody = z.infer<typeof updateDadosPagamentoBodySchema>
