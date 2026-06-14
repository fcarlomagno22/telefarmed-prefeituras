import { supabaseAdmin } from '../../db/supabase.js'

type AccessLogRow = {
  id: string
  portal: 'admin' | 'prefeitura' | 'ubt' | 'profissional'
  ator_id: string | null
  ator_nome_snapshot: string
  cpf_snapshot: string
  acao:
    | 'login_sucesso'
    | 'login_falha'
    | 'logout'
    | 'refresh'
    | 'sessao_revogada'
  ip: string | null
  user_agent: string
  metadata: Record<string, unknown>
  created_at: string
}

const ACAO_LABELS: Record<AccessLogRow['acao'], string> = {
  login_sucesso: 'Login realizado',
  login_falha: 'Falha no login',
  logout: 'Logout',
  refresh: 'Renovação de sessão',
  sessao_revogada: 'Sessão revogada',
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function mapAccessRow(row: AccessLogRow) {
  const success = row.acao !== 'login_falha'

  return {
    id: row.id,
    kind: 'acesso' as const,
    createdAt: row.created_at,
    platform: row.portal,
    prefeituraName: null,
    ubtName: typeof row.metadata.ubtName === 'string' ? row.metadata.ubtName : null,
    severity: success ? ('info' as const) : ('warning' as const),
    dateTime: formatDateTime(row.created_at),
    userName: row.ator_nome_snapshot || 'Usuário',
    userRole: typeof row.metadata.role === 'string' ? row.metadata.role : '',
    actionLabel: ACAO_LABELS[row.acao],
    httpMethod: 'POST',
    actionTone: 'auth' as const,
    moduleName: 'Autenticação',
    pagePath: '/login',
    resourceLabel: row.ator_nome_snapshot || row.cpf_snapshot || '—',
    resourceId: row.ator_id ?? '',
    serverResponse: success ? 'Sucesso' : 'Falha',
    serverResponseTone: success ? ('success' as const) : ('error' as const),
    ipAddress: row.ip ? String(row.ip) : '',
    deviceInfo: row.user_agent || '—',
  }
}

async function loadEntityActorIds(entidadeId: string): Promise<string[]> {
  const [gestores, operadores] = await Promise.all([
    supabaseAdmin
      .from('usuarios_prefeitura')
      .select('id')
      .eq('entidade_contratante_id', entidadeId),
    supabaseAdmin.from('usuarios_ubt').select('id').eq('entidade_contratante_id', entidadeId),
  ])

  if (gestores.error) throw gestores.error
  if (operadores.error) throw operadores.error

  return [
    ...(gestores.data ?? []).map((row) => String(row.id)),
    ...(operadores.data ?? []).map((row) => String(row.id)),
  ]
}

export async function listPrefeituraCredenciaisAccessLogs(
  entidadeId: string,
  query: {
    limit?: number
    offset?: number
    search?: string
    from?: string
    to?: string
    atorId?: string
    portal?: 'prefeitura' | 'ubt'
    acao?: AccessLogRow['acao']
  },
) {
  const actorIds = await loadEntityActorIds(entidadeId)
  if (actorIds.length === 0) {
    return { entries: [], total: 0 }
  }

  if (query.atorId && !actorIds.includes(query.atorId)) {
    return { entries: [], total: 0 }
  }

  const limit = query.limit ?? 50
  const offset = query.offset ?? 0
  const portals = query.portal ? [query.portal] : (['prefeitura', 'ubt'] as const)

  let dbQuery = supabaseAdmin
    .from('auditoria_acessos')
    .select('*', { count: 'exact' })
    .in('portal', [...portals])
    .in('ator_id', query.atorId ? [query.atorId] : actorIds)
    .order('created_at', { ascending: false })

  if (query.acao) dbQuery = dbQuery.eq('acao', query.acao)
  if (query.from) dbQuery = dbQuery.gte('created_at', query.from)
  if (query.to) dbQuery = dbQuery.lte('created_at', query.to)

  const search = query.search?.trim().toLowerCase()
  if (search) {
    dbQuery = dbQuery.or(
      `ator_nome_snapshot.ilike.%${search}%,cpf_snapshot.ilike.%${search}%`,
    )
  }

  const { data, error, count } = await dbQuery.range(offset, offset + limit - 1)
  if (error) throw error

  return {
    entries: ((data ?? []) as AccessLogRow[]).map(mapAccessRow),
    total: count ?? 0,
  }
}
