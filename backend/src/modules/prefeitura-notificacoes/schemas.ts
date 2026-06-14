import { z } from 'zod'

export const listNotificationsQuerySchema = z.object({
  direction: z.enum(['all', 'inbox', 'sent']).optional(),
  origin: z.string().trim().optional(),
  read: z.enum(['all', 'unread', 'read']).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})

const broadcastBaseSchema = z.object({
  message: z.string().trim().min(1).max(8000),
  priority: z.enum(['normal', 'important']).optional(),
})

const medicoBroadcastSchema = broadcastBaseSchema.extend({
  recipientTarget: z.literal('medico'),
  mode: z.enum(['all', 'selected']),
  profissionalIds: z.array(z.string().uuid()).optional(),
})

export const createPrefeituraBroadcastSchema = z
  .union([
    broadcastBaseSchema.extend({
      recipientTarget: z.literal('ubt'),
      recipientScope: z.enum(['ubt', 'responsible', 'operators']),
      unitIds: z.array(z.string().uuid()).min(1).max(200),
      operatorIds: z.array(z.string().uuid()).optional(),
    }),
    medicoBroadcastSchema,
  ])
  .superRefine((value, ctx) => {
    if (
      value.recipientTarget === 'medico' &&
      value.mode === 'selected' &&
      (!value.profissionalIds || value.profissionalIds.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione ao menos um profissional.',
        path: ['profissionalIds'],
      })
    }
  })

export const prefeituraProfissionaisCatalogQuerySchema = z.object({
  search: z.string().trim().optional(),
})

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>
export type CreatePrefeituraBroadcastBody = z.infer<typeof createPrefeituraBroadcastSchema>
export type PrefeituraProfissionaisCatalogQuery = z.infer<
  typeof prefeituraProfissionaisCatalogQuerySchema
>
