import { supabaseAdmin } from '../../db/supabase.js'
import { STATUS_LABELS } from './constants.js'
import { mapTicketListRow } from './formatters.js'
import { buildPortalListOrigins } from './ownership.js'
import type { PortalActor } from './types.js'
import type { z } from 'zod'
import type { listPortalTicketsQuerySchema, listTicketsQuerySchema } from './schemas.js'

type AdminListQuery = z.infer<typeof listTicketsQuerySchema>
type PortalListQuery = z.infer<typeof listPortalTicketsQuerySchema>

function applySearchFilter<T extends { or: (filter: string) => T }>(
  query: T,
  search?: string,
): T {
  if (!search?.trim()) return query
  const term = search.trim().replace(/[%_,]/g, ' ')
  return query.or(
    [
      `numero_exibicao.ilike.%${term}%`,
      `assunto.ilike.%${term}%`,
      `categoria.ilike.%${term}%`,
      `municipio_nome.ilike.%${term}%`,
      `unidade_ubt_nome.ilike.%${term}%`,
      `aberto_por_nome.ilike.%${term}%`,
    ].join(','),
  )
}

export async function listAdminSupportTickets(query: AdminListQuery) {
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let dbQuery = supabaseAdmin.from('vw_chamados_suporte_listagem').select('*', { count: 'exact' })

  if (query.status) dbQuery = dbQuery.eq('status', query.status)
  if (query.source) dbQuery = dbQuery.eq('origem', query.source)
  if (query.openOnly) dbQuery = dbQuery.neq('status', 'encerrado')
  if (query.awaitingOnly) dbQuery = dbQuery.eq('status', 'aguardando_resposta')
  dbQuery = applySearchFilter(dbQuery, query.search)
  dbQuery = dbQuery.order('atualizado_em', { ascending: false }).range(from, to)

  const { data, error, count } = await dbQuery
  if (error) throw error

  const total = count ?? 0
  return {
    tickets: (data ?? []).map((row) => mapTicketListRow(row as Record<string, unknown>)),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function listPortalSupportTickets(actor: PortalActor, query: PortalListQuery) {
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const origins = buildPortalListOrigins(actor)

  let dbQuery = supabaseAdmin.from('vw_chamados_suporte_listagem').select('*', { count: 'exact' })

  dbQuery = dbQuery.in('origem', origins)

  if (actor.variant === 'ubt') {
    dbQuery = dbQuery
      .eq('entidade_contratante_id', actor.entidadeId!)
      .eq('unidade_ubt_id', actor.unitId!)
  } else if (actor.variant === 'prefeitura') {
    dbQuery = dbQuery.eq('entidade_contratante_id', actor.entidadeId!)
  } else {
    dbQuery = dbQuery.eq('profissional_referencia_id', actor.userId)
  }

  if (query.status) dbQuery = dbQuery.eq('status', query.status)
  if (query.openOnly) dbQuery = dbQuery.neq('status', 'encerrado')
  dbQuery = applySearchFilter(dbQuery, query.search)
  dbQuery = dbQuery.order('atualizado_em', { ascending: false }).range(from, to)

  const { data, error, count } = await dbQuery
  if (error) throw error

  const total = count ?? 0
  return {
    tickets: (data ?? []).map((row) => mapTicketListRow(row as Record<string, unknown>)),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export { STATUS_LABELS }
