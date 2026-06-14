import { supabaseAdmin } from '../../db/supabase.js'
import { isMissingSupabaseResource } from '../../lib/supabaseErrors.js'
import { mapAdminComunicadoRow } from '../comunicados/formatters.js'
import type { AdminBroadcastDto, AdminBroadcastTargetSnapshot } from '../comunicados/types.js'
import type { ListBroadcastsQuery } from './schemas.js'

export type AdminNotificationKpis = {
  monthlySendCount: number
  lastBroadcastPrefeituraCount: number
  lastBroadcastUbtCount: number
  importantUnreadCount: number
}

function monthStartIso() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

function countFromTargets(targets: AdminBroadcastTargetSnapshot[], channel: 'prefeitura' | 'ubt') {
  return targets.filter((item) => item.channel === channel).reduce((sum, item) => sum + item.count, 0)
}

export async function getAdminNotificationKpis(): Promise<AdminNotificationKpis> {
  const monthStart = monthStartIso()

  const [monthlyResult, latestResult, importantResult] = await Promise.all([
    supabaseAdmin
      .from('comunicados')
      .select('id', { count: 'exact', head: true })
      .eq('remetente_tipo', 'admin')
      .gte('enviado_em', monthStart),
    supabaseAdmin
      .from('comunicados')
      .select('alvos_snapshot, prioridade')
      .eq('remetente_tipo', 'admin')
      .order('enviado_em', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from('comunicados')
      .select('id', { count: 'exact', head: true })
      .eq('remetente_tipo', 'admin')
      .eq('prioridade', 'importante')
      .gte('enviado_em', monthStart),
  ])

  if (monthlyResult.error) {
    if (isMissingSupabaseResource(monthlyResult.error, 'comunicados')) {
      return {
        monthlySendCount: 0,
        lastBroadcastPrefeituraCount: 0,
        lastBroadcastUbtCount: 0,
        importantUnreadCount: 0,
      }
    }
    throw monthlyResult.error
  }
  if (latestResult.error) throw latestResult.error
  if (importantResult.error) throw importantResult.error

  const latestTargets = Array.isArray(latestResult.data?.alvos_snapshot)
    ? (latestResult.data.alvos_snapshot as AdminBroadcastTargetSnapshot[])
    : []

  return {
    monthlySendCount: monthlyResult.count ?? 0,
    lastBroadcastPrefeituraCount: countFromTargets(latestTargets, 'prefeitura'),
    lastBroadcastUbtCount: countFromTargets(latestTargets, 'ubt'),
    importantUnreadCount: importantResult.count ?? 0,
  }
}

export async function listAdminBroadcasts(query: ListBroadcastsQuery): Promise<{
  broadcasts: AdminBroadcastDto[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}> {
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 10
  const search = query.search?.trim()

  let dbQuery = supabaseAdmin
    .from('comunicados')
    .select(
      'id, titulo, corpo, prioridade, remetente_nome, alvos_snapshot, destinatarios_resumo, total_destinatarios, enviado_em',
      { count: 'exact' },
    )
    .eq('remetente_tipo', 'admin')
    .order('enviado_em', { ascending: false })

  if (search) {
    dbQuery = dbQuery.or(
      `titulo.ilike.%${search}%,corpo.ilike.%${search}%,destinatarios_resumo.ilike.%${search}%`,
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await dbQuery.range(from, to)
  if (error) {
    if (isMissingSupabaseResource(error, 'comunicados')) {
      return { broadcasts: [], page, pageSize, total: 0, totalPages: 1 }
    }
    throw error
  }

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    broadcasts: (data ?? []).map((row) =>
      mapAdminComunicadoRow({
        id: String(row.id),
        titulo: String(row.titulo),
        corpo: String(row.corpo),
        prioridade: row.prioridade as import('../comunicados/types.js').PrioridadeComunicado,
        remetente_nome: String(row.remetente_nome),
        alvos_snapshot: row.alvos_snapshot,
        destinatarios_resumo: String(row.destinatarios_resumo),
        total_destinatarios: Number(row.total_destinatarios),
        enviado_em: String(row.enviado_em),
      }),
    ),
    page,
    pageSize,
    total,
    totalPages,
  }
}
