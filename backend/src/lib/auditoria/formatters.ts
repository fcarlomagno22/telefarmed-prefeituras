import type { AuditLogEntryDto } from './types.js'

const ACAO_ACESSO_LABELS: Record<string, string> = {
  login_sucesso: 'Login realizado',
  login_falha: 'Falha no login',
  logout: 'Logout',
  refresh: 'Renovação de sessão',
  sessao_revogada: 'Sessão revogada',
}

const ACAO_EVENTO_LABELS: Record<string, string> = {
  visualizar: 'Visualização',
  inserir: 'Inserção',
  editar: 'Alteração',
  excluir: 'Exclusão',
  acao_sensivel: 'Ação sensível',
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

function mapEventActionTone(acao: string): AuditLogEntryDto['actionTone'] {
  switch (acao) {
    case 'inserir':
      return 'create'
    case 'editar':
      return 'update'
    case 'excluir':
      return 'delete'
    default:
      return 'view'
  }
}

function resolveSeverity(input: {
  kind: 'acesso' | 'evento'
  acao: string
  statusCode?: number
}): AuditLogEntryDto['severity'] {
  if (input.kind === 'acesso' && input.acao === 'login_falha') return 'warning'
  if (input.acao === 'excluir' || input.acao === 'acao_sensivel') return 'critical'
  if (input.statusCode != null && input.statusCode >= 500) return 'critical'
  if (input.statusCode != null && input.statusCode >= 400) return 'warning'
  return 'info'
}

function readPayloadString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key]
  return typeof value === 'string' && value.trim() ? value : null
}

export type AuditoriaListRow = {
  id: string
  kind: 'acesso' | 'evento'
  created_at: string
  portal: AuditLogEntryDto['platform']
  ator_id: string | null
  ator_nome: string | null
  entidade_contratante_id: string | null
  unidade_ubt_id: string | null
  pagina: string | null
  acao_raw: string
  recurso_tipo: string | null
  recurso_id: string | null
  descricao: string | null
  payload: Record<string, unknown> | null
  ip: string | null
  user_agent: string | null
  cpf_snapshot: string | null
  ator_tipo: string | null
  prefeitura_nome: string | null
  ubt_nome: string | null
}

export function formatAuditoriaListRow(row: AuditoriaListRow): AuditLogEntryDto {
  const payload = row.payload ?? {}
  const isAccess = row.kind === 'acesso'
  const statusCode =
    typeof payload.statusCode === 'number' ? payload.statusCode : undefined
  const httpMethod =
    typeof payload.method === 'string' ? payload.method.toUpperCase() : isAccess ? 'POST' : 'GET'

  const actionLabel = isAccess
    ? (ACAO_ACESSO_LABELS[row.acao_raw] ?? row.acao_raw)
    : readPayloadString(payload, 'actionLabel') ??
      (row.descricao?.trim() || ACAO_EVENTO_LABELS[row.acao_raw] || row.acao_raw)

  const success =
    isAccess && row.acao_raw !== 'login_falha'
      ? true
      : statusCode != null
        ? statusCode < 400
        : row.acao_raw !== 'login_falha'

  const moduleName =
    readPayloadString(payload, 'moduleName') ??
    (row.pagina ? row.pagina.split('/')[0] : isAccess ? 'Autenticação' : 'API')

  const pagePath =
    readPayloadString(payload, 'pagePath') ??
    (typeof payload.path === 'string' ? payload.path : row.pagina ?? '/')

  return {
    id: row.id,
    kind: row.kind,
    createdAt: row.created_at,
    platform: row.portal,
    prefeituraName:
      row.prefeitura_nome ??
      readPayloadString(payload, 'prefeituraName') ??
      null,
    ubtName: row.ubt_nome ?? readPayloadString(payload, 'ubtName') ?? null,
    severity: resolveSeverity({ kind: row.kind, acao: row.acao_raw, statusCode }),
    dateTime: formatDateTime(row.created_at),
    userName: row.ator_nome?.trim() || readPayloadString(payload, 'actorName') || 'Usuário',
    userRole:
      readPayloadString(payload, 'actorRole') ?? row.ator_tipo?.trim() ?? '',
    actionLabel,
    httpMethod,
    actionTone: isAccess ? 'auth' : mapEventActionTone(row.acao_raw),
    moduleName,
    pagePath,
    resourceLabel:
      readPayloadString(payload, 'resourceLabel') ??
      (row.descricao?.trim() ||
        row.recurso_tipo?.trim() ||
        row.ator_nome?.trim() ||
        '—'),
    resourceId: row.recurso_id?.trim() || row.ator_id || '',
    serverResponse:
      typeof payload.serverResponse === 'string'
        ? payload.serverResponse
        : statusCode != null
          ? `${statusCode}`
          : success
            ? 'Sucesso'
            : 'Falha',
    serverResponseTone: success ? 'success' : 'error',
    ipAddress: row.ip ? String(row.ip) : '',
    deviceInfo: row.user_agent?.trim() || readPayloadString(payload, 'userAgent') || '—',
  }
}

export function mapHttpStatusToServerResponse(statusCode: number): {
  label: string
  tone: AuditLogEntryDto['serverResponseTone']
} {
  if (statusCode >= 500) {
    return { label: `${statusCode} Erro`, tone: 'error' }
  }
  if (statusCode >= 400) {
    return { label: `${statusCode}`, tone: 'warning' }
  }
  return { label: `${statusCode} OK`, tone: 'success' }
}

export function mapHttpMethodToActionTone(
  method: string,
): AuditLogEntryDto['actionTone'] {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'create'
    case 'PUT':
    case 'PATCH':
      return 'update'
    case 'DELETE':
      return 'delete'
    default:
      return 'view'
  }
}
