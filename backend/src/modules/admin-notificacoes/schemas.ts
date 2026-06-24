import { z } from 'zod'

export const listNotificationsQuerySchema = z.object({
  direction: z.enum(['all', 'inbox', 'sent']).optional(),
  origin: z.string().trim().optional(),
  read: z.enum(['all', 'unread', 'read']).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})

export const listBroadcastsQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})

const adminMedicoTargetSchema = z.union([
  z.object({
    channel: z.literal('medico'),
    mode: z.literal('users'),
    userIds: z.array(z.string().uuid()).min(1).max(500),
  }),
  z.object({
    channel: z.literal('medico'),
    mode: z.literal('all'),
    audienceScope: z.enum(['medico_all', 'medico_plantao', 'medico_especialidade']),
    specialtyFilter: z.string().trim().optional(),
  }),
])

const adminTargetSchema = z.union([
  z.object({
    channel: z.literal('prefeitura'),
    mode: z.enum(['all', 'selected', 'users']),
    recipientIds: z.array(z.string().uuid()).optional(),
    userIds: z.array(z.string().uuid()).optional(),
  }),
  z.object({
    channel: z.literal('ubt'),
    mode: z.enum(['all', 'selected', 'users']),
    recipientIds: z.array(z.string().uuid()).optional(),
    userIds: z.array(z.string().uuid()).optional(),
  }),
  adminMedicoTargetSchema,
  z.object({
    channel: z.literal('paciente_app'),
    mode: z.enum(['all', 'selected']),
    entidadeIds: z.array(z.string().uuid()).optional(),
  }),
])

export const createAdminBroadcastSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(8000),
  priority: z.enum(['normal', 'important']),
  targets: z.array(adminTargetSchema).min(1).max(20),
})

export const recipientCatalogQuerySchema = z.object({
  uf: z.string().trim().length(2).optional(),
  municipality: z.string().uuid().optional(),
  prefeituraId: z.string().uuid().optional(),
  unidadeId: z.string().uuid().optional(),
  search: z.string().trim().optional(),
  specialty: z.string().trim().optional(),
})

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>
export type ListBroadcastsQuery = z.infer<typeof listBroadcastsQuerySchema>
export type CreateAdminBroadcastBody = z.infer<typeof createAdminBroadcastSchema>
export type RecipientCatalogQuery = z.infer<typeof recipientCatalogQuerySchema>
