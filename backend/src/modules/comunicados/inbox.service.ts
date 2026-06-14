import { supabaseAdmin } from '../../db/supabase.js'
import { isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { ComunicadosError } from './errors.js'
import { mapInboxRowToNotification, mapSentRowToNotification } from './formatters.js'
import type {
  PortalNotificationDto,
  PortalNotificationKpis,
  PortalNotificationListResult,
  PrioridadeComunicado,
} from './types.js'

export type PortalListFilters = {
  direction?: 'all' | 'inbox' | 'sent'
  origin?: string
  read?: 'all' | 'unread' | 'read'
  search?: string
  page?: number
  pageSize?: number
}

type InboxPortal = 'prefeitura' | 'ubt' | 'profissional'

const INBOX_VIEW: Record<InboxPortal, string> = {
  prefeitura: 'vw_comunicados_prefeitura_inbox',
  ubt: 'vw_comunicados_ubt_inbox',
  profissional: 'vw_comunicados_profissional_inbox',
}

const INBOX_USER_COLUMN: Record<InboxPortal, string> = {
  prefeitura: 'usuario_prefeitura_id',
  ubt: 'usuario_ubt_id',
  profissional: 'profissional_id',
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  }
}

function matchesSearch(item: PortalNotificationDto, search?: string) {
  if (!search?.trim()) return true
  const needle = search.trim().toLowerCase()
  return [item.title, item.body, item.senderLabel, item.recipientLabel]
    .join(' ')
    .toLowerCase()
    .includes(needle)
}

async function listInboxForPortal(
  portal: InboxPortal,
  userId: string,
  filters: PortalListFilters,
): Promise<PortalNotificationDto[]> {
  const view = INBOX_VIEW[portal]
  const userColumn = INBOX_USER_COLUMN[portal]

  let query = supabaseAdmin.from(view).select('*').eq(userColumn, userId).order('enviado_em', { ascending: false })

  if (filters.origin) {
    query = query.eq('origem', filters.origin)
  }
  if (filters.read === 'unread') {
    query = query.is('lido_em', null)
  } else if (filters.read === 'read') {
    query = query.not('lido_em', 'is', null)
  }

  const { data, error } = await query
  if (error) {
    if (isMissingSupabaseResource(error, view)) return []
    throw error
  }

  return (data ?? []).map((row) => mapInboxRowToNotification(row as Parameters<typeof mapInboxRowToNotification>[0]))
}

async function listSentForPrefeitura(
  userId: string,
  entidadeId: string,
  filters: PortalListFilters,
): Promise<PortalNotificationDto[]> {
  let query = supabaseAdmin
    .from('comunicados')
    .select(
      'id, titulo, corpo, prioridade, origem, audiencia, unidade_ubt_id, remetente_nome, especialidade_filtro, destinatarios_resumo, enviado_em, unidades_ubt(nome)',
    )
    .eq('remetente_prefeitura_id', userId)
    .eq('entidade_contratante_id', entidadeId)
    .order('enviado_em', { ascending: false })

  if (filters.origin) {
    query = query.eq('origem', filters.origin)
  }

  const { data, error } = await query
  if (error) {
    if (isMissingSupabaseResource(error, 'comunicados')) return []
    throw error
  }

  return (data ?? []).map((row) => {
    const unitJoin = row.unidades_ubt as { nome?: string } | null
    return mapSentRowToNotification({
      id: String(row.id),
      titulo: String(row.titulo),
      corpo: String(row.corpo),
      prioridade: row.prioridade as PrioridadeComunicado,
      origem: row.origem as PortalNotificationDto['origin'],
      audiencia: row.audiencia as PortalNotificationDto['audience'],
      unidade_ubt_id: row.unidade_ubt_id ? String(row.unidade_ubt_id) : null,
      remetente_nome: String(row.remetente_nome),
      especialidade_filtro: row.especialidade_filtro ? String(row.especialidade_filtro) : null,
      destinatarios_resumo: String(row.destinatarios_resumo),
      enviado_em: String(row.enviado_em),
      unidade_nome: unitJoin?.nome ?? null,
    })
  })
}

async function listSentForUbt(
  userId: string,
  entidadeId: string,
  unitId: string,
  filters: PortalListFilters,
): Promise<PortalNotificationDto[]> {
  let query = supabaseAdmin
    .from('comunicados')
    .select(
      'id, titulo, corpo, prioridade, origem, audiencia, unidade_ubt_id, remetente_nome, especialidade_filtro, destinatarios_resumo, enviado_em, unidades_ubt(nome)',
    )
    .eq('remetente_ubt_id', userId)
    .eq('entidade_contratante_id', entidadeId)
    .eq('unidade_ubt_id', unitId)
    .order('enviado_em', { ascending: false })

  if (filters.origin) {
    query = query.eq('origem', filters.origin)
  }

  const { data, error } = await query
  if (error) {
    if (isMissingSupabaseResource(error, 'comunicados')) return []
    throw error
  }

  return (data ?? []).map((row) => {
    const unitJoin = row.unidades_ubt as { nome?: string } | null
    return mapSentRowToNotification({
      id: String(row.id),
      titulo: String(row.titulo),
      corpo: String(row.corpo),
      prioridade: row.prioridade as PrioridadeComunicado,
      origem: row.origem as PortalNotificationDto['origin'],
      audiencia: row.audiencia as PortalNotificationDto['audience'],
      unidade_ubt_id: row.unidade_ubt_id ? String(row.unidade_ubt_id) : null,
      remetente_nome: String(row.remetente_nome),
      especialidade_filtro: row.especialidade_filtro ? String(row.especialidade_filtro) : null,
      destinatarios_resumo: String(row.destinatarios_resumo),
      enviado_em: String(row.enviado_em),
      unidade_nome: unitJoin?.nome ?? null,
    })
  })
}

export async function listPortalNotifications(
  portal: InboxPortal,
  userId: string,
  context: { entidadeId?: string; unitId?: string },
  filters: PortalListFilters = {},
): Promise<PortalNotificationListResult> {
  const page = filters.page && filters.page > 0 ? filters.page : 1
  const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.min(filters.pageSize, 100) : 50
  const direction = filters.direction ?? 'all'

  let notifications: PortalNotificationDto[] = []

  if (direction === 'all' || direction === 'inbox') {
    notifications.push(...(await listInboxForPortal(portal, userId, filters)))
  }

  if (direction === 'all' || direction === 'sent') {
    if (portal === 'prefeitura' && context.entidadeId) {
      notifications.push(...(await listSentForPrefeitura(userId, context.entidadeId, filters)))
    }
    if (portal === 'ubt' && context.entidadeId && context.unitId) {
      notifications.push(...(await listSentForUbt(userId, context.entidadeId, context.unitId, filters)))
    }
  }

  notifications = notifications
    .filter((item) => matchesSearch(item, filters.search))
    .sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1))

  const paged = paginate(notifications, page, pageSize)
  return {
    notifications: paged.items,
    page: paged.page,
    pageSize: paged.pageSize,
    total: paged.total,
    totalPages: paged.totalPages,
  }
}

export async function getPortalNotificationKpis(
  portal: InboxPortal,
  userId: string,
  context: { entidadeId?: string; unitId?: string },
): Promise<PortalNotificationKpis> {
  const inbox = await listInboxForPortal(portal, userId, {})
  let sent: PortalNotificationDto[] = []

  if (portal === 'prefeitura' && context.entidadeId) {
    sent = await listSentForPrefeitura(userId, context.entidadeId, {})
  } else if (portal === 'ubt' && context.entidadeId && context.unitId) {
    sent = await listSentForUbt(userId, context.entidadeId, context.unitId, {})
  }

  const lastBroadcast = sent.find((item) =>
    ['ubt_all', 'ubt_responsible', 'ubt_user'].includes(item.audience),
  )

  let lastBroadcastUbtCount = 0
  if (lastBroadcast) {
    const match = lastBroadcast.recipientLabel.match(/(\d+)/)
    lastBroadcastUbtCount = match ? Number(match[1]) : 0
  }

  return {
    unreadCount: inbox.filter((item) => item.readAt == null).length,
    inboxCount: inbox.length,
    sentCount: sent.length,
    telefarmedInboxCount: inbox.filter((item) => item.origin === 'telefarmed').length,
    lastBroadcastUbtCount,
  }
}

async function assertDestinatarioOwnership(
  portal: InboxPortal,
  userId: string,
  comunicadoId: string,
): Promise<void> {
  const column =
    portal === 'prefeitura'
      ? 'usuario_prefeitura_id'
      : portal === 'ubt'
        ? 'usuario_ubt_id'
        : 'profissional_id'

  const { data, error } = await supabaseAdmin
    .from('comunicado_destinatarios')
    .select('id')
    .eq('comunicado_id', comunicadoId)
    .eq(column, userId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ComunicadosError('Notificação não encontrada.', 'NOTIFICATION_NOT_FOUND', 404)
  }
}

export async function markPortalNotificationRead(
  portal: InboxPortal,
  userId: string,
  comunicadoId: string,
): Promise<void> {
  await assertDestinatarioOwnership(portal, userId, comunicadoId)

  const column =
    portal === 'prefeitura'
      ? 'usuario_prefeitura_id'
      : portal === 'ubt'
        ? 'usuario_ubt_id'
        : 'profissional_id'

  const { error } = await supabaseAdmin
    .from('comunicado_destinatarios')
    .update({ lido_em: new Date().toISOString() })
    .eq('comunicado_id', comunicadoId)
    .eq(column, userId)
    .is('lido_em', null)

  if (error) throw error
}

export async function markAllPortalNotificationsRead(
  portal: InboxPortal,
  userId: string,
): Promise<number> {
  const column =
    portal === 'prefeitura'
      ? 'usuario_prefeitura_id'
      : portal === 'ubt'
        ? 'usuario_ubt_id'
        : 'profissional_id'

  const now = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('comunicado_destinatarios')
    .update({ lido_em: now })
    .eq(column, userId)
    .is('lido_em', null)
    .select('id')

  if (error) throw error
  return data?.length ?? 0
}
