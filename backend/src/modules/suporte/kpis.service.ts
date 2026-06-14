import { supabaseAdmin } from '../../db/supabase.js'
import { PRIORITY_LABELS, STATUS_LABELS } from './constants.js'
import { buildPortalListOrigins } from './ownership.js'
import type { PortalActor } from './types.js'

const MONTHLY_TREND_DAYS = 10

type KpiRow = {
  id: string
  status: string
  prioridade: string
  aberto_em: string
  solicitante_visualizado_em: string | null
}

function buildMonthlyTrend(rows: Array<{ aberto_em: string }>) {
  const now = new Date()
  const buckets: Array<{ label: string; count: number }> = []

  for (let index = MONTHLY_TREND_DAYS - 1; index >= 0; index -= 2) {
    const day = new Date(now)
    day.setDate(now.getDate() - index)
    const label = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }).format(day)
    const dayKey = day.toISOString().slice(0, 10)
    const count = rows.filter((row) => row.aberto_em.slice(0, 10) === dayKey).length
    buckets.push({ label, count })
  }

  return buckets
}

function buildPriorityDistribution(rows: Array<{ prioridade: string }>) {
  const total = rows.length || 1
  const counts = { alta: 0, media: 0, baixa: 0 } as Record<string, number>

  for (const row of rows) {
    counts[row.prioridade] = (counts[row.prioridade] ?? 0) + 1
  }

  return (['alta', 'media', 'baixa'] as const).map((key) => ({
    key,
    label: PRIORITY_LABELS[key],
    count: counts[key] ?? 0,
    percent: Math.round(((counts[key] ?? 0) / total) * 100),
    gradientFrom: key === 'alta' ? '#f87171' : key === 'media' ? '#fb923c' : '#4ade80',
    gradientTo: key === 'alta' ? '#ef4444' : key === 'media' ? '#f97316' : '#22c55e',
  }))
}

function buildStatusSummary(rows: Array<{ status: string }>) {
  return (Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map((key) => ({
    key,
    label: STATUS_LABELS[key],
    count: rows.filter((row) => row.status === key).length,
  }))
}

async function countUnreadSupportMessages(
  ticketIds: string[],
  viewedMap: Map<string, string | null>,
) {
  if (!ticketIds.length) return 0

  const { data, error } = await supabaseAdmin
    .from('mensagens_chamado_suporte')
    .select('chamado_id, enviado_em')
    .in('chamado_id', ticketIds)
    .eq('autor_tipo', 'support')
    .eq('excluido', false)

  if (error) throw error

  return (data ?? []).filter((message) => {
    const viewedAt = viewedMap.get(String(message.chamado_id))
    if (!viewedAt) return true
    return String(message.enviado_em) > viewedAt
  }).length
}

function mapKpiRows(data: unknown[]): KpiRow[] {
  return data.map((row) => {
    const item = row as Record<string, unknown>
    return {
      id: String(item.id),
      status: String(item.status),
      prioridade: String(item.prioridade),
      aberto_em: String(item.aberto_em),
      solicitante_visualizado_em: item.solicitante_visualizado_em
        ? String(item.solicitante_visualizado_em)
        : null,
    }
  })
}

export async function getAdminSupportKpis() {
  const { data, error } = await supabaseAdmin
    .from('chamados_suporte')
    .select('id, status, prioridade, aberto_em, solicitante_visualizado_em')

  if (error) throw error

  const rows = mapKpiRows(data ?? [])
  const openCount = rows.filter((row) => row.status !== 'encerrado').length
  const awaitingCount = rows.filter((row) => row.status === 'aguardando_resposta').length

  return {
    awaitingCount,
    unreadSupportMessagesCount: awaitingCount,
    openCount,
    total: rows.length,
    statusSummary: buildStatusSummary(rows),
    priorityDistribution: buildPriorityDistribution(rows),
    monthlyTrend: buildMonthlyTrend(rows),
  }
}

export async function getPortalSupportKpis(actor: PortalActor) {
  const origins = buildPortalListOrigins(actor)

  let query = supabaseAdmin
    .from('chamados_suporte')
    .select('id, status, prioridade, aberto_em, solicitante_visualizado_em')
    .in('origem', origins)

  if (actor.variant === 'ubt') {
    query = query
      .eq('entidade_contratante_id', actor.entidadeId!)
      .eq('unidade_ubt_id', actor.unitId!)
  } else if (actor.variant === 'prefeitura') {
    query = query.eq('entidade_contratante_id', actor.entidadeId!)
  } else {
    query = query.eq('profissional_referencia_id', actor.userId)
  }

  const { data, error } = await query
  if (error) throw error

  const rows = mapKpiRows(data ?? [])
  const openRows = rows.filter((row) => row.status !== 'encerrado')
  const awaitingCount = rows.filter((row) => row.status === 'respondido').length
  const viewedMap = new Map(rows.map((row) => [row.id, row.solicitante_visualizado_em]))
  const unreadSupportMessagesCount = await countUnreadSupportMessages(
    openRows.map((row) => row.id),
    viewedMap,
  )

  return {
    awaitingCount,
    unreadSupportMessagesCount,
    openCount: openRows.length,
    total: rows.length,
    statusSummary: buildStatusSummary(rows),
    priorityDistribution: buildPriorityDistribution(rows),
    monthlyTrend: buildMonthlyTrend(rows),
  }
}
