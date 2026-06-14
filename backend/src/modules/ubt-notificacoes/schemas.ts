import { z } from 'zod'
import { listNotificationsQuerySchema } from '../prefeitura-notificacoes/schemas.js'

export const createUbtBroadcastSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(8000),
    priority: z.enum(['normal', 'important']),
    mode: z.enum(['all', 'selected']).optional().default('all'),
    profissionalIds: z.array(z.string().uuid()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.mode === 'selected' && (!value.profissionalIds || value.profissionalIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione ao menos um profissional.',
        path: ['profissionalIds'],
      })
    }
  })

export const ubtProfissionaisCatalogQuerySchema = z.object({
  search: z.string().trim().optional(),
})

export { listNotificationsQuerySchema }
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>
export type CreateUbtBroadcastBody = z.infer<typeof createUbtBroadcastSchema>
export type UbtProfissionaisCatalogQuery = z.infer<typeof ubtProfissionaisCatalogQuerySchema>
