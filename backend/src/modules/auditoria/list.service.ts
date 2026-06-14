import { supabaseAdmin } from '../../db/supabase.js'
import {
  formatAuditoriaListRow,
  type AuditoriaListRow,
} from '../../lib/auditoria/formatters.js'
import type { AuditLogEntryDto, AuditoriaScopeFilter, ListAuditoriaQuery } from '../../lib/auditoria/types.js'
import { applyAccessScopeFilter, applyEventScopeFilter } from './filters.js'
import { mergeAuditoriaQueryLimits } from './scope.service.js'

type AccessRow = {
  id: string
  portal: AuditoriaListRow['portal']
  ator_id: string | null
  ator_nome_snapshot: string
  cpf_snapshot: string
  acao: string
  ip: string | null
  user_agent: string
  metadata: Record<string, unknown>
  created_at: string
}

type EventRow = {
  id: string
  portal: AuditoriaListRow['portal']
  ator_id: string | null
  ator_tipo: string
  entidade_contratante_id: string | null
  unidade_ubt_id: string | null
  pagina: string
  acao: string
  recurso_tipo: string
  recurso_id: string
  descricao: string
  payload: Record<string, unknown>
  ip: string | null
  created_at: string
}

function mapAccessRow(row: AccessRow): AuditoriaListRow {
  return {
    id: row.id,
    kind: 'acesso',
    created_at: row.created_at,
    portal: row.portal,
    ator_id: row.ator_id,
    ator_nome: row.ator_nome_snapshot,
    entidade_contratante_id: null,
    unidade_ubt_id: null,
    pagina: '/login',
    acao_raw: row.acao,
    recurso_tipo: 'acesso',
    recurso_id: row.ator_id ?? '',
    descricao: '',
    payload: {
      ...(row.metadata ?? {}),
      userAgent: row.user_agent,
    },
    ip: row.ip,
    user_agent: row.user_agent,
    cpf_snapshot: row.cpf_snapshot,
    ator_tipo: 'auth',
    prefeitura_nome: null,
    ubt_nome: null,
  }
}

function mapEventRow(row: EventRow): AuditoriaListRow {
  const payload = row.payload ?? {}
  return {
    id: row.id,
    kind: 'evento',
    created_at: row.created_at,
    portal: row.portal,
    ator_id: row.ator_id,
    ator_nome: typeof payload.actorName === 'string' ? payload.actorName : null,
    entidade_contratante_id: row.entidade_contratante_id,
    unidade_ubt_id: row.unidade_ubt_id,
    pagina: row.pagina,
    acao_raw: row.acao,
    recurso_tipo: row.recurso_tipo,
    recurso_id: row.recurso_id,
    descricao: row.descricao,
    payload,
    ip: row.ip,
    user_agent: typeof payload.userAgent === 'string' ? payload.userAgent : null,
    cpf_snapshot: null,
    ator_tipo: row.ator_tipo,
    prefeitura_nome: typeof payload.prefeituraName === 'string' ? payload.prefeituraName : null,
    ubt_nome: typeof payload.ubtName === 'string' ? payload.ubtName : null,
  }
}

async function countAccessRows(scope: AuditoriaScopeFilter, query: ListAuditoriaQuery): Promise<number> {
  let dbQuery = supabaseAdmin.from('auditoria_acessos').select('id', { count: 'exact', head: true })

  dbQuery = applyAccessScopeFilter(dbQuery, scope, query.atorId)

  if (query.portal) dbQuery = dbQuery.eq('portal', query.portal)
  if (query.from) dbQuery = dbQuery.gte('created_at', query.from)
  if (query.to) dbQuery = dbQuery.lte('created_at', query.to)

  const search = query.search?.trim()
  if (search) {
    dbQuery = dbQuery.or(`ator_nome_snapshot.ilike.%${search}%,cpf_snapshot.ilike.%${search}%`)
  }

  const { count, error } = await dbQuery
  if (error) throw error
  return count ?? 0
}

async function countEventRows(scope: AuditoriaScopeFilter, query: ListAuditoriaQuery): Promise<number> {
  let dbQuery = supabaseAdmin.from('auditoria_eventos').select('id', { count: 'exact', head: true })

  dbQuery = applyEventScopeFilter(dbQuery, scope, query.atorId)

  if (query.portal) dbQuery = dbQuery.eq('portal', query.portal)
  if (query.from) dbQuery = dbQuery.gte('created_at', query.from)
  if (query.to) dbQuery = dbQuery.lte('created_at', query.to)
  if (query.pagina) dbQuery = dbQuery.ilike('pagina', `%${query.pagina}%`)
  if (query.recursoTipo) dbQuery = dbQuery.eq('recurso_tipo', query.recursoTipo)
  if (query.recursoId) dbQuery = dbQuery.eq('recurso_id', query.recursoId)
  if (query.acao) dbQuery = dbQuery.eq('acao', query.acao)

  const search = query.search?.trim()
  if (search) {
    dbQuery = dbQuery.or(`descricao.ilike.%${search}%,pagina.ilike.%${search}%,recurso_tipo.ilike.%${search}%`)
  }

  const { count, error } = await dbQuery
  if (error) throw error
  return count ?? 0
}

async function fetchAccessRows(
  scope: AuditoriaScopeFilter,
  query: ListAuditoriaQuery,
  fetchLimit: number,
): Promise<AuditoriaListRow[]> {
  let dbQuery = supabaseAdmin
    .from('auditoria_acessos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(fetchLimit)

  dbQuery = applyAccessScopeFilter(dbQuery, scope, query.atorId)

  if (query.portal) dbQuery = dbQuery.eq('portal', query.portal)
  if (query.from) dbQuery = dbQuery.gte('created_at', query.from)
  if (query.to) dbQuery = dbQuery.lte('created_at', query.to)

  const search = query.search?.trim()
  if (search) {
    dbQuery = dbQuery.or(`ator_nome_snapshot.ilike.%${search}%,cpf_snapshot.ilike.%${search}%`)
  }

  const { data, error } = await dbQuery
  if (error) throw error
  return ((data ?? []) as AccessRow[]).map(mapAccessRow)
}

async function fetchEventRows(
  scope: AuditoriaScopeFilter,
  query: ListAuditoriaQuery,
  fetchLimit: number,
): Promise<AuditoriaListRow[]> {
  let dbQuery = supabaseAdmin
    .from('auditoria_eventos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(fetchLimit)

  dbQuery = applyEventScopeFilter(dbQuery, scope, query.atorId)

  if (query.portal) dbQuery = dbQuery.eq('portal', query.portal)
  if (query.from) dbQuery = dbQuery.gte('created_at', query.from)
  if (query.to) dbQuery = dbQuery.lte('created_at', query.to)
  if (query.pagina) dbQuery = dbQuery.ilike('pagina', `%${query.pagina}%`)
  if (query.recursoTipo) dbQuery = dbQuery.eq('recurso_tipo', query.recursoTipo)
  if (query.recursoId) dbQuery = dbQuery.eq('recurso_id', query.recursoId)
  if (query.acao) dbQuery = dbQuery.eq('acao', query.acao)

  const search = query.search?.trim()
  if (search) {
    dbQuery = dbQuery.or(`descricao.ilike.%${search}%,pagina.ilike.%${search}%,recurso_tipo.ilike.%${search}%`)
  }

  const { data, error } = await dbQuery
  if (error) throw error
  return ((data ?? []) as EventRow[]).map(mapEventRow)
}

export async function listAuditoriaEntries(
  scope: AuditoriaScopeFilter,
  query: ListAuditoriaQuery,
): Promise<{ entries: AuditLogEntryDto[]; total: number; totalAcessos: number; totalEventos: number }> {
  const { limit, offset, fetchLimit } = mergeAuditoriaQueryLimits(query)

  const [accessRows, eventRows, totalAcessos, totalEventos] = await Promise.all([
    fetchAccessRows(scope, query, fetchLimit),
    fetchEventRows(scope, query, fetchLimit),
    countAccessRows(scope, query),
    countEventRows(scope, query),
  ])

  const merged = [...accessRows, ...eventRows].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const page = merged.slice(offset, offset + limit).map(formatAuditoriaListRow)

  return {
    entries: page,
    total: totalAcessos + totalEventos,
    totalAcessos,
    totalEventos,
  }
}

export async function getAuditoriaSummary(
  scope: AuditoriaScopeFilter,
  query: Pick<ListAuditoriaQuery, 'from' | 'to' | 'portal'>,
): Promise<{
  totalEvents: number
  criticalEvents: number
  activeUsers: number
  totalAcessos: number
}> {
  const list = await listAuditoriaEntries(scope, {
    ...query,
    limit: 500,
    offset: 0,
  })

  const criticalEvents = list.entries.filter((entry) => entry.severity === 'critical').length
  const activeUsers = new Set(
    list.entries.map((entry) => entry.userName).filter((name) => name && name !== 'Usuário'),
  ).size

  return {
    totalEvents: list.totalEventos,
    criticalEvents,
    activeUsers,
    totalAcessos: list.totalAcessos,
  }
}

export async function recordClientAuditoriaEvent(input: {
  actor: import('../../lib/auditoria/types.js').AuditActorContext
  ip?: string | null
  userAgent?: string
  pagePath: string
  actionLabel: string
  moduleName?: string
  resourceLabel?: string
  resourceId?: string
  payload?: Record<string, unknown>
}): Promise<void> {
  const { logAuditoriaEvento } = await import('../../lib/auditoria/write.service.js')
  await logAuditoriaEvento({
    portal: input.actor.portal,
    acao: 'visualizar',
    pagina: input.moduleName ?? 'navegacao',
    descricao: input.actionLabel,
    recursoTipo: 'pagina',
    recursoId: input.pagePath,
    actor: input.actor,
    ip: input.ip,
    payload: {
      ...(input.payload ?? {}),
      pagePath: input.pagePath,
      actionLabel: input.actionLabel,
      moduleName: input.moduleName ?? 'navegacao',
      resourceLabel: input.resourceLabel ?? input.pagePath,
      userAgent: input.userAgent,
      source: 'client',
    },
  })
}
