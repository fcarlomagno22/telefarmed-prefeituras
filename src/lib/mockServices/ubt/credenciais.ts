import type { AccessLevelId } from '../../../config/accessCredentials'
import type { AdminOperatorRow } from '../../../data/adminOperadoresMock'
import { adminOperatorsInitialRows } from '../../../data/adminOperadoresMock'
import { accessLogs } from '../../../data/accessLogsMock'
import type { AuditLogEntry } from '../../../types/auditLogs'
import { isValidMockAuthorizationPin } from '../../mockAuth/mockAuthCredentials'
import { mockDelay } from '../delay'

export type UbtCredentialsListQuery = {
  search?: string
  profile?: string
  status?: 'ativo' | 'inativo'
}

export type UbtCredentialsAccessLogsQuery = {
  limit?: number
  offset?: number
  search?: string
  from?: string
  to?: string
  atorId?: string
  acao?: 'login_sucesso' | 'login_falha' | 'logout' | 'refresh' | 'sessao_revogada'
}

export class UbtCredenciaisApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'UbtCredenciaisApiError'
    this.status = status
    this.code = code
  }
}

const usersState: AdminOperatorRow[] = structuredClone(
  adminOperatorsInitialRows.filter((row) => row.scope === 'UBT'),
)

function clone<T>(value: T): T {
  return structuredClone(value)
}

function toAuditLogEntry(log: (typeof accessLogs)[number]): AuditLogEntry {
  return {
    id: log.id,
    kind: 'acesso',
    createdAt: log.accessedAt,
    platform: 'ubt',
    prefeituraName: null,
    ubtName: 'UBT Centro',
    severity: log.outcome === 'success' ? 'info' : 'warning',
    dateTime: new Date(log.accessedAt).toLocaleString('pt-BR'),
    userName: log.userName,
    userRole: 'Operador',
    actionLabel: log.outcome === 'success' ? 'Login realizado' : 'Falha de autenticacao',
    httpMethod: 'POST',
    actionTone: 'auth',
    moduleName: 'Credenciais',
    pagePath: '/ubt/credenciais',
    resourceLabel: log.userEmail,
    resourceId: log.userId,
    serverResponse: log.outcome === 'success' ? '200 OK' : '401 Unauthorized',
    serverResponseTone: log.outcome === 'success' ? 'success' : 'error',
    ipAddress: log.ipAddress,
    deviceInfo: log.device,
  }
}

const accessEntriesState: AuditLogEntry[] = accessLogs.map(toAuditLogEntry)

function applyUserQuery(query?: UbtCredentialsListQuery): AdminOperatorRow[] {
  let rows = [...usersState]
  if (query?.search?.trim()) {
    const needle = query.search.trim().toLowerCase()
    rows = rows.filter((row) =>
      [row.name, row.email, row.cpf ?? '', row.role].join(' ').toLowerCase().includes(needle),
    )
  }
  if (query?.profile?.trim()) {
    rows = rows.filter((row) => row.role.toLowerCase() === query.profile?.trim().toLowerCase())
  }
  if (query?.status) {
    rows = rows.filter((row) => row.status === query.status)
  }
  return rows
}

function applyLogQuery(query?: UbtCredentialsAccessLogsQuery) {
  let entries = [...accessEntriesState]
  if (query?.search?.trim()) {
    const needle = query.search.trim().toLowerCase()
    entries = entries.filter((entry) =>
      [entry.userName, entry.resourceLabel, entry.ipAddress, entry.deviceInfo]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }
  if (query?.atorId) {
    entries = entries.filter((entry) => entry.resourceId === query.atorId)
  }
  if (query?.from) {
    const fromMs = new Date(query.from).getTime()
    entries = entries.filter((entry) => new Date(entry.createdAt ?? 0).getTime() >= fromMs)
  }
  if (query?.to) {
    const toMs = new Date(query.to).getTime()
    entries = entries.filter((entry) => new Date(entry.createdAt ?? 0).getTime() <= toMs)
  }
  const offset = query?.offset ?? 0
  const limit = query?.limit ?? entries.length
  return {
    entries: entries.slice(offset, offset + limit),
    total: entries.length,
  }
}

function requireUser(id: string): AdminOperatorRow {
  const user = usersState.find((row) => row.id === id)
  if (!user) throw new UbtCredenciaisApiError('Usuario nao encontrado.', 404, 'USER_NOT_FOUND')
  return user
}

export async function fetchUbtPortalCredentials(
  _accessToken: string,
  query?: UbtCredentialsListQuery,
): Promise<{
  users: AdminOperatorRow[]
  canManage: boolean
}> {
  void _accessToken
  return mockDelay({ users: clone(applyUserQuery(query)), canManage: true })
}

export async function fetchUbtUnitSummary(_accessToken: string): Promise<{
  id: string
  entidadeContratanteId: string
}> {
  void _accessToken
  const first = usersState[0]
  return mockDelay({
    id: first?.ubtId ?? 'ubt_centro',
    entidadeContratanteId: first?.contractingEntity.id ?? 'ent-op-sao-jose-dos-campos',
  })
}

export async function fetchUbtPortalCredentialById(
  _accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  return mockDelay(clone(requireUser(id)))
}

export async function fetchUbtCredenciaisAccessLogs(
  _accessToken: string,
  query?: UbtCredentialsAccessLogsQuery,
): Promise<{ entries: AuditLogEntry[]; total: number }> {
  return mockDelay(applyLogQuery(query))
}

export async function createUbtPortalCredential(
  _accessToken: string,
  body: {
    name: string
    email: string
    cpf: string
    role: string
    accessLevel: string
    status: 'ativo' | 'inativo'
    pagePermissions: AdminOperatorRow['pagePermissions']
    password: string
  },
): Promise<AdminOperatorRow> {
  const created: AdminOperatorRow = {
    ...(usersState[0] ?? ({} as AdminOperatorRow)),
    id: `cred-mock-${Date.now()}`,
    name: body.name,
    email: body.email,
    cpf: body.cpf,
    role: body.role,
    accessLevel: body.accessLevel as AccessLevelId,
    status: body.status,
    pagePermissions: body.pagePermissions,
    initials: body.name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase(),
    hasPassword: Boolean(body.password),
    profileLabel: body.role,
    lastAccessLabel: 'Sem acesso recente',
  }
  usersState.unshift(created)
  return mockDelay(clone(created))
}

export async function updateUbtPortalCredential(
  _accessToken: string,
  id: string,
  body: {
    name?: string
    email?: string
    role?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    pagePermissions?: AdminOperatorRow['pagePermissions']
    password?: string
  },
): Promise<AdminOperatorRow> {
  const user = requireUser(id)
  Object.assign(user, {
    ...(body.name != null ? { name: body.name } : {}),
    ...(body.email != null ? { email: body.email } : {}),
    ...(body.role != null ? { role: body.role, profileLabel: body.role } : {}),
    ...(body.accessLevel != null ? { accessLevel: body.accessLevel } : {}),
    ...(body.status != null ? { status: body.status } : {}),
    ...(body.pagePermissions != null ? { pagePermissions: body.pagePermissions } : {}),
    ...(body.password != null ? { hasPassword: body.password.length > 0 } : {}),
  })
  return mockDelay(clone(user))
}

export async function deactivateUbtPortalCredential(
  _accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  const user = requireUser(id)
  user.status = 'inativo'
  return mockDelay(clone(user))
}

export async function activateUbtPortalCredential(
  _accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  const user = requireUser(id)
  user.status = 'ativo'
  return mockDelay(clone(user))
}

export async function deleteUbtPortalCredential(_accessToken: string, id: string): Promise<void> {
  const index = usersState.findIndex((row) => row.id === id)
  if (index < 0) throw new UbtCredenciaisApiError('Usuario nao encontrado.', 404, 'USER_NOT_FOUND')
  usersState.splice(index, 1)
  return mockDelay(undefined)
}

export async function verifyUbtPortalResponsiblePin(
  _accessToken: string,
  pin: string,
): Promise<void> {
  if (!isValidMockAuthorizationPin(pin)) {
    throw new UbtCredenciaisApiError('PIN invalido.', 400, 'INVALID_PIN')
  }
  return mockDelay(undefined)
}

export function isUbtCredenciaisApiError(error: unknown): error is UbtCredenciaisApiError {
  return error instanceof UbtCredenciaisApiError
}
