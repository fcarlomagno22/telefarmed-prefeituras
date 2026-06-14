import type { PrefeituraNotification } from '../../../data/prefeituraNotificacoesMock'
import { prefeituraNotificacoes } from '../../../data/prefeituraNotificacoesMock'
import { fetchPrefeituraRedeBroadcastCatalog } from './rede'

export class PrefeituraNotificacoesApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PrefeituraNotificacoesApiError'
    this.status = status
    this.code = code
  }
}

export type PortalNotificationKpisResponse = {
  unreadCount: number
  inboxCount: number
  sentCount: number
  telefarmedInboxCount: number
  lastBroadcastUbtCount: number
}

export type PortalNotificationListResponse = {
  notifications: PrefeituraNotification[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type CreatePrefeituraBroadcastPayload =
  | {
      recipientTarget: 'ubt'
      message: string
      recipientScope: 'ubt' | 'responsible' | 'operators'
      unitIds: string[]
      operatorIds?: string[]
      priority?: 'normal' | 'important'
    }
  | {
      recipientTarget: 'medico'
      message: string
      mode: 'all' | 'selected'
      profissionalIds?: string[]
      priority?: 'normal' | 'important'
    }

export type PrefeituraProfissionalRecipient = {
  id: string
  name: string
  specialty: string
}

export type PrefeituraBroadcastUbtCatalog = {
  units: import('./rede').PrefeituraRedeUnitApi[]
  operators: import('../../../data/prefeituraRedeBroadcastMock').PrefeituraRedeUbtOperator[]
  regionOptions: Array<{ value: string; label: string }>
}

const notificationsState: PrefeituraNotification[] = structuredClone(prefeituraNotificacoes)

function clone<T>(value: T): T {
  return structuredClone(value)
}

function computeKpis(): PortalNotificationKpisResponse {
  const inbox = notificationsState.filter((item) => item.direction === 'inbox')
  const sent = notificationsState.filter((item) => item.direction === 'sent')
  const lastBroadcast = sent.find((item) => item.audience === 'ubt_all')
  return {
    unreadCount: inbox.filter((item) => item.readAt == null).length,
    inboxCount: inbox.length,
    sentCount: sent.length,
    telefarmedInboxCount: inbox.filter((item) => item.origin === 'telefarmed').length,
    lastBroadcastUbtCount: lastBroadcast ? 24 : 0,
  }
}

export function isPrefeituraNotificacoesApiError(
  error: unknown,
): error is PrefeituraNotificacoesApiError {
  return error instanceof PrefeituraNotificacoesApiError
}

export async function fetchPrefeituraNotificationKpis(_accessToken: string) {
  void _accessToken
  return mockDelay(computeKpis())
}

export async function fetchPrefeituraNotifications(
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
  void _accessToken
  let notifications = [...notificationsState]

  if (params?.direction && params.direction !== 'all') {
    notifications = notifications.filter((item) => item.direction === params.direction)
  }
  if (params?.origin) {
    notifications = notifications.filter((item) => item.origin === params.origin)
  }
  if (params?.read === 'unread') {
    notifications = notifications.filter((item) => item.direction === 'inbox' && item.readAt == null)
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

  return mockDelay<PortalNotificationListResponse>({
    notifications: clone(notifications.slice(start, start + pageSize)),
    page,
    pageSize,
    total,
    totalPages,
  })
}

export async function fetchPrefeituraBroadcastUbtCatalog(accessToken: string) {
  return fetchPrefeituraRedeBroadcastCatalog(accessToken)
}

export async function fetchPrefeituraProfissionaisCatalog(
  _accessToken: string,
  _params?: { search?: string },
) {
  void _accessToken
  void _params
  return mockDelay({
    profissionais: [
      { id: 'prof-1', name: 'Dra. Ana Silva', specialty: 'Clínica geral' },
      { id: 'prof-2', name: 'Dr. Bruno Costa', specialty: 'Pediatria' },
      { id: 'prof-3', name: 'Dr. Carlos Lima', specialty: 'Cardiologia' },
    ] satisfies PrefeituraProfissionalRecipient[],
  })
}

export async function createPrefeituraBroadcast(
  _accessToken: string,
  payload: CreatePrefeituraBroadcastPayload,
) {
  void _accessToken
  const now = new Date().toISOString()
  const recipientCount =
    payload.recipientTarget === 'medico'
      ? payload.mode === 'all'
        ? 12
        : payload.profissionalIds?.length ?? 0
      : payload.recipientScope === 'operators'
        ? payload.operatorIds?.length ?? 0
        : payload.unitIds.length

  notificationsState.unshift({
    id: `pref-broadcast-${Date.now()}`,
    direction: 'sent',
    origin: 'contract_manager',
    audience:
      payload.recipientTarget === 'medico'
        ? 'medico_all'
        : payload.recipientScope === 'ubt'
          ? 'ubt_all'
          : payload.recipientScope === 'responsible'
            ? 'ubt_responsible'
            : 'ubt_user',
    title:
      payload.recipientTarget === 'medico'
        ? 'Comunicado enviado aos profissionais'
        : 'Comunicado enviado à rede',
    body: payload.message,
    sentAt: now,
    readAt: now,
    senderLabel: 'Gestão municipal',
    recipientLabel:
      payload.recipientTarget === 'medico'
        ? `${recipientCount} profissional(is)`
        : payload.recipientScope === 'ubt'
          ? `${recipientCount} unidade(s)`
          : `${recipientCount} destinatário(s)`,
    priority: payload.priority ?? 'normal',
  })

  return mockDelay({ message: 'Comunicado enviado com sucesso.', recipientCount })
}

export async function markPrefeituraNotificationRead(_accessToken: string, id: string) {
  void _accessToken
  const notification = notificationsState.find((item) => item.id === id)
  if (!notification) {
    throw new PrefeituraNotificacoesApiError('Notificação não encontrada.', 404, 'NOTIFICATION_NOT_FOUND')
  }
  if (notification.direction === 'inbox' && notification.readAt == null) {
    notification.readAt = new Date().toISOString()
  }
  return mockDelay({ ok: true })
}

export async function markAllPrefeituraNotificationsRead(_accessToken: string) {
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
