import { z } from 'zod'

export const listAuditoriaQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  search: z.string().max(200).optional(),
  portal: z.enum(['admin', 'prefeitura', 'ubt', 'profissional']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  atorId: z.string().uuid().optional(),
  acao: z.string().max(80).optional(),
  pagina: z.string().max(120).optional(),
  recursoTipo: z.string().max(120).optional(),
  recursoId: z.string().max(120).optional(),
})

export const clientAuditoriaEventSchema = z.object({
  pagePath: z.string().min(1).max(240),
  actionLabel: z.string().min(1).max(240),
  moduleName: z.string().max(120).optional(),
  resourceLabel: z.string().max(240).optional(),
  resourceId: z.string().max(120).optional(),
  payload: z.record(z.unknown()).optional(),
})
