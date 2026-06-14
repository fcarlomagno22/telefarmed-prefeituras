import type { PrefeituraNotification } from '../../../data/prefeituraNotificacoesMock'
import {
  buildProfissionalNotificationsSeed,
  sanitizeProfissionalNotifications,
} from '../../../data/profissionalNotificacoesMock'
import { mockDelay } from '../delay'

export class ProfissionalNotificacoesApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ProfissionalNotificacoesApiError'
    this.status = status
    this.code = code
  }
}

export type ProfissionalNotificationKpisResponse = {
  unreadCount: number
  inboxCount: number
  sentCount: number
  telefarmedInboxCount: number
  lastBroadcastUbtCount: number
}

export type ProfissionalNotificationListResponse = {
  notifications: PrefeituraNotification[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const notificationsState: PrefeituraNotification[] = sanitizeProfissionalNotifications(
  buildProfissionalNotificationsSeed(),
).sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1))

function clone<T>(value: T): T {
  return structuredClone(value)
}

function isUnreadInbox(item: PrefeituraNotification) {
  return item.direction === 'inbox' && item.readAt == null
}

function computeKpis(): ProfissionalNotificationKpisResponse {
  const inbox = notificationsState.filter((item) => item.direction === 'inbox')
  const sent = notificationsState.filter((item) => item.direction === 'sent')

  return {
    unreadCount: inbox.filter((item) => item.readAt == null).length,
    inboxCount: inbox.length,
    sentCount: sent.length,
    telefarmedInboxCount: inbox.filter((item) => item.origin === 'telefarmed').length,
    lastBroadcastUbtCount: 0,
  }
}

export function isProfissionalNotificacoesApiError(
  error: unknown,
): error is ProfissionalNotificacoesApiError {
  return error instanceof ProfissionalNotificacoesApiError
}

export async function fetchProfissionalNotificationKpis(_accessToken: string) {
  void _accessToken
  return mockDelay(computeKpis())
}

export async function fetchProfissionalNotifications(
  _accessToken: string,
  params?: {
    origin?: string
    read?: 'all' | 'unread' | 'read'
    search?: string
    page?: number
    pageSize?: number
  },
) {
  void _accessToken
  let notifications = notificationsState.filter((item) => item.direction === 'inbox')

  if (params?.origin) {
    notifications = notifications.filter((item) => item.origin === params.origin)
  }
  if (params?.read === 'unread') {
    notifications = notifications.filter(isUnreadInbox)
  }
  if (params?.read === 'read') {
    notifications = notifications.filter(
      (item) => item.direction === 'inbox' && item.readAt != null,
    )
  }
  if (params?.search?.trim()) {
    const needle = params.search.trim().toLowerCase()
    notifications = notifications.filter((item) =>
      [item.title, item.body, item.senderLabel, item.recipientLabel]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }

  const page = params?.page && params.page > 0 ? params.page : 1
  const pageSize = params?.pageSize && params.pageSize > 0 ? params.pageSize : 50
  const total = notifications.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize

  return mockDelay<ProfissionalNotificationListResponse>({
    notifications: clone(notifications.slice(start, start + pageSize)),
    page,
    pageSize,
    total,
    totalPages,
  })
}

export async function markProfissionalNotificationRead(_accessToken: string, id: string) {
  void _accessToken
  const notification = notificationsState.find((item) => item.id === id)
  if (!notification) {
    throw new ProfissionalNotificacoesApiError(
      'Notificação não encontrada.',
      404,
      'NOTIFICATION_NOT_FOUND',
    )
  }
  if (notification.direction === 'inbox' && notification.readAt == null) {
    notification.readAt = new Date().toISOString()
  }
  return mockDelay({ ok: true })
}

export async function markAllProfissionalNotificationsRead(_accessToken: string) {
  void _accessToken
  const now = new Date().toISOString()
  let count = 0

  for (const item of notificationsState) {
    if (item.direction === 'inbox' && item.readAt == null) {
      item.readAt = now
      count += 1
    }
  }

  return mockDelay({ count })
}
