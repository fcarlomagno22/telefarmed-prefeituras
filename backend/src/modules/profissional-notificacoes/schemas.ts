import { z } from 'zod'

export const listNotificationsQuerySchema = z.object({
  origin: z.string().trim().optional(),
  read: z.enum(['all', 'unread', 'read']).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
})

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>
