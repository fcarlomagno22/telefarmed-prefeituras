import { buildUbtNotificationsSeed, sanitizeUbtNotifications } from '../../../data/ubtNotificacoesMock'
import type { PrefeituraNotification } from '../../../data/prefeituraNotificacoesMock'
import { prefeituraNotificacoes } from '../../../data/prefeituraNotificacoesMock'
import { currentUbtUnit } from '../../../config/ubtSession'
import { brand } from '../../../config/brand'
import { mockDelay } from '../delay'

export class UbtNotificacoesApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'UbtNotificacoesApiError'
    this.status = status
    this.code = code
  }
}

export type UbtNotificationKpisResponse = {
  unreadCount: number
  inboxCount: number
  sentCount: number
  telefarmedInboxCount: number
  lastBroadcastUbtCount: number
}

export type UbtNotificationListResponse = {
  notifications: PrefeituraNotification[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type CreateUbtBroadcastPayload = {
  title: string
  body: string
  priority: 'normal' | 'important'
  mode?: 'all' | 'selected'
  profissionalIds?: string[]
}

export type UbtProfissionalRecipient = {
  id: string
  name: string
  specialty: string
}

const notificationsState: PrefeituraNotification[] = sanitizeUbtNotifications([
  ...buildUbtNotificationsSeed(),
  ...prefeituraNotificacoes.filter(
    (item) =>
      item.direction === 'inbox' &&
      item.origin !== 'ubt' &&
      item.unitId === currentUbtUnit.id,
  ),
]).sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1))

function clone<T>(value: T): T {
  return structuredClone(value)
}

function isUnreadInbox(item: PrefeituraNotification) {
  return item.direction === 'inbox' && item.readAt == null
}

function computeKpis(): UbtNotificationKpisResponse {
  const inbox = notificationsState.filter((item) => item.direction === 'inbox')
  const sent = notificationsState.filter((item) => item.direction === 'sent')
  return {
    unreadCount: inbox.filter((item) => item.readAt == null).length,
    inboxCount: inbox.length,
    sentCount: sent.length,
    telefarmedInboxCount: inbox.filter((item) => item.origin === 'telefarmed').length,
    lastBroadcastUbtCount: sent.slice(0, 1).length,
  }
}

export function isUbtNotificacoesApiError(error: unknown): error is UbtNotificacoesApiError {
  return error instanceof UbtNotificacoesApiError
}

export async function fetchUbtNotificationKpis(_accessToken: string) {
  void _accessToken
  return mockDelay(computeKpis())
}

export async function fetchUbtNotifications(
  _accessToken: string,
  params?: {
    direction?: 'all' | 'inbox' | 'sent'
    origin?: string
    read?: 'all' | 'unread' | 'read'
    search?: string
    page?: number
    pageSize?: number
  },
) {
  let notifications = [...notificationsState]

  if (params?.direction && params.direction !== 'all') {
    notifications = notifications.filter((item) => item.direction === params.direction)
  }
  if (params?.origin) {
    notifications = notifications.filter((item) => item.origin === params.origin)
  }
  if (params?.read === 'unread') {
    notifications = notifications.filter(isUnreadInbox)
  }
  if (params?.read === 'read') {
    notifications = notifications.filter((item) => item.direction === 'inbox' && item.readAt != null)
  }
  if (params?.search?.trim()) {
    const needle = params.search.trim().toLowerCase()
    notifications = notifications.filter((item) =>
      [item.title, item.body, item.senderLabel, item.recipientLabel].join(' ').toLowerCase().includes(needle),
    )
  }

  const page = params?.page && params.page > 0 ? params.page : 1
  const pageSize = params?.pageSize && params.pageSize > 0 ? params.pageSize : 50
  const total = notifications.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize

  return mockDelay<UbtNotificationListResponse>({
    notifications: clone(notifications.slice(start, start + pageSize)),
    page,
    pageSize,
    total,
    totalPages,
  })
}

export async function fetchUbtProfissionaisCatalog(_accessToken: string, _params?: { search?: string }) {
  void _accessToken
  void _params
  return mockDelay({
    profissionais: [
      { id: 'prof-1', name: 'Dra. Ana Silva', specialty: 'Clínica geral' },
      { id: 'prof-2', name: 'Dr. Bruno Costa', specialty: 'Pediatria' },
    ] satisfies UbtProfissionalRecipient[],
  })
}

export async function createUbtBroadcast(_accessToken: string, payload: CreateUbtBroadcastPayload) {
  void _accessToken
  const now = new Date().toISOString()
  notificationsState.unshift({
    id: `ubt-broadcast-${Date.now()}`,
    direction: 'sent',
    origin: 'ubt',
    audience: 'contract_manager',
    title: payload.title,
    body: payload.body,
    sentAt: now,
    readAt: now,
    unitId: currentUbtUnit.id,
    unitName: currentUbtUnit.name,
    senderLabel: `${currentUbtUnit.name} · ${brand.operatorName}`,
    recipientLabel: 'Profissionais da unidade',
    priority: payload.priority,
  })
  return mockDelay({ message: 'Notificacao enviada com sucesso.' })
}

export async function markUbtNotificationRead(_accessToken: string, id: string) {
  const notification = notificationsState.find((item) => item.id === id)
  if (!notification) {
    throw new UbtNotificacoesApiError('Notificacao nao encontrada.', 404, 'NOTIFICATION_NOT_FOUND')
  }
  if (notification.direction === 'inbox' && notification.readAt == null) {
    notification.readAt = new Date().toISOString()
  }
  return mockDelay({ ok: true })
}

export async function markAllUbtNotificationsRead(_accessToken: string) {
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
