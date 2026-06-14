import type { PrefeituraCredentialUser } from '../../../config/prefeituraCredenciaisConfig'
import { buildPresetPagePermissions } from '../../../config/accessCredentials'
import type { AdminOperatorRow } from '../../../data/adminOperadoresMock'
import { adminOperatorsInitialRows } from '../../../data/adminOperadoresMock'
import {
  findPrefeituraCredentialUbtOption,
  prefeituraAccessCredentialUsers,
  prefeituraCredentialsUbtOptions,
  type PrefeituraCredentialUbtOption,
} from '../../../data/prefeituraAccessCredentialsMock'
import { auditLogsAllEntries } from '../../../data/auditLogsMock'
import type { AuditLogEntry } from '../../../types/auditLogs'
import { isValidMockAuthorizationPin } from '../../mockAuth/mockAuthCredentials'
import { mockDelay } from '../delay'

export type PrefeituraCredentialsAccessLogsQuery = {
  limit?: number
  offset?: number
  search?: string
  from?: string
  to?: string
  atorId?: string
  portal?: 'admin' | 'prefeitura' | 'ubt' | 'profissional'
  acao?: 'login_sucesso' | 'login_falha' | 'logout' | 'refresh' | 'sessao_revogada'
}

export class PrefeituraCredenciaisApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PrefeituraCredenciaisApiError'
    this.status = status
    this.code = code
  }
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function mapAccessUserToOperatorRow(user: (typeof prefeituraAccessCredentialUsers)[number]): AdminOperatorRow {
  const entity = adminOperatorsInitialRows[0]?.contractingEntity ?? {
    id: 'ent-brasilia',
    razaoSocial: 'Prefeitura do Distrito Federal',
    municipality: 'Brasília',
    uf: 'DF',
  }

  return {
    ...user,
    scope: 'UBT',
    unitName: user.ubtName,
    contractingEntity: entity,
    lastAccessLabel: 'Há 2 dias',
    profileLabel: user.role,
  }
}

function mapOperatorToGestor(row: AdminOperatorRow): PrefeituraCredentialUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    cpf: row.cpf ?? '',
    role: row.role,
    contractingEntityId: row.contractingEntity.id,
    contractingEntity: row.contractingEntity,
    accessLevel: row.accessLevel,
    status: row.status,
    initials: row.initials,
    avatarClassName: row.avatarClassName,
    hasPassword: row.hasPassword,
    hasAuthorizationPin: row.hasAuthorizationPin ?? false,
    lastAccessLabel: row.lastAccessLabel,
    pagePermissions: row.pagePermissions as PrefeituraCredentialUser['pagePermissions'],
  }
}

let portalState: AdminOperatorRow[] = structuredClone(
  prefeituraAccessCredentialUsers.map(mapAccessUserToOperatorRow),
)
let gestorState: PrefeituraCredentialUser[] = structuredClone(
  adminOperatorsInitialRows.filter((row) => row.scope === 'Prefeitura').map(mapOperatorToGestor),
)

function ensurePortal(id: string) {
  const user = portalState.find((item) => item.id === id)
  if (!user) throw new PrefeituraCredenciaisApiError('Credencial não encontrada.', 404)
  return user
}

function ensureGestor(id: string) {
  const user = gestorState.find((item) => item.id === id)
  if (!user) throw new PrefeituraCredenciaisApiError('Gestor não encontrado.', 404)
  return user
}

export function isPrefeituraCredenciaisApiError(
  error: unknown,
): error is PrefeituraCredenciaisApiError {
  return error instanceof PrefeituraCredenciaisApiError
}

export async function fetchPrefeituraPortalCredentials(
  _accessToken: string,
): Promise<AdminOperatorRow[]> {
  void _accessToken
  return mockDelay(clone(portalState), 60)
}

export async function fetchPrefeituraUbtOptions(
  _accessToken: string,
): Promise<PrefeituraCredentialUbtOption[]> {
  void _accessToken
  return mockDelay(clone(prefeituraCredentialsUbtOptions), 60)
}

export async function fetchPrefeituraEntitySummary(_accessToken: string) {
  void _accessToken
  const entity = adminOperatorsInitialRows[0]?.contractingEntity ?? {
    id: 'ent-brasilia',
    razaoSocial: 'Prefeitura do Distrito Federal',
    municipality: 'Brasília',
    uf: 'DF',
  }
  return mockDelay({
    id: entity.id,
    razaoSocial: entity.razaoSocial,
    municipality: entity.municipality,
    uf: entity.uf,
    label: `${entity.municipality} · ${entity.uf}`,
  })
}

export async function createPrefeituraPortalCredential(
  _accessToken: string,
  body: {
    name: string
    email: string
    cpf: string
    role: string
    accessLevel: string
    status: 'ativo' | 'inativo'
    ubtId: string
    isUbtResponsible?: boolean
    pagePermissions: AdminOperatorRow['pagePermissions']
    password: string
    authorizationPin?: string
  },
): Promise<AdminOperatorRow> {
  void _accessToken
  const option = findPrefeituraCredentialUbtOption(body.ubtId)
  const entity = adminOperatorsInitialRows[0]?.contractingEntity!
  const user: AdminOperatorRow = {
    id: `pref-portal-${Date.now()}`,
    name: body.name,
    email: body.email,
    cpf: body.cpf,
    role: body.role,
    accessLevel: body.accessLevel as AdminOperatorRow['accessLevel'],
    status: body.status,
    initials: body.name.slice(0, 2).toUpperCase(),
    avatarClassName: 'bg-sky-100 text-sky-700',
    hasPassword: Boolean(body.password),
    hasAuthorizationPin: Boolean(body.authorizationPin),
    pagePermissions: body.pagePermissions,
    ubtId: body.ubtId,
    ubtName: option?.ubtName ?? 'UBT',
    raKey: option?.raKey ?? 'central',
    raLabel: option?.raLabel ?? 'RA Central',
    isUbtResponsible: body.isUbtResponsible ?? false,
    scope: 'UBT',
    unitName: option?.ubtName ?? 'UBT',
    contractingEntity: entity,
    lastAccessLabel: 'Sem acesso recente',
    profileLabel: body.role,
  }
  portalState = [user, ...portalState]
  return mockDelay(clone(user), 70)
}

export async function updatePrefeituraPortalCredential(
  _accessToken: string,
  id: string,
  body: {
    name?: string
    email?: string
    role?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    ubtId?: string
    isUbtResponsible?: boolean
    pagePermissions?: AdminOperatorRow['pagePermissions']
    password?: string
    authorizationPin?: string | null
  },
): Promise<AdminOperatorRow> {
  void _accessToken
  const user = ensurePortal(id)
  Object.assign(user, body)
  if (body.ubtId) {
    const option = findPrefeituraCredentialUbtOption(body.ubtId)
    user.ubtId = body.ubtId
    user.ubtName = option?.ubtName ?? user.ubtName
    user.unitName = option?.ubtName ?? user.unitName
    user.raKey = option?.raKey ?? user.raKey
    user.raLabel = option?.raLabel ?? user.raLabel
  }
  if (body.authorizationPin !== undefined) user.hasAuthorizationPin = Boolean(body.authorizationPin)
  if (body.password !== undefined) user.hasPassword = Boolean(body.password)
  return mockDelay(clone(user), 70)
}

export async function deactivatePrefeituraPortalCredential(
  _accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  void _accessToken
  const user = ensurePortal(id)
  user.status = 'inativo'
  return mockDelay(clone(user), 70)
}

export async function activatePrefeituraPortalCredential(
  _accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  void _accessToken
  const user = ensurePortal(id)
  user.status = 'ativo'
  return mockDelay(clone(user), 70)
}

export async function deletePrefeituraPortalCredential(
  _accessToken: string,
  id: string,
): Promise<void> {
  void _accessToken
  portalState = portalState.filter((item) => item.id !== id)
  return mockDelay(undefined, 60)
}

export async function transferPrefeituraPortalCredentialUbt(
  _accessToken: string,
  id: string,
  targetUbtId: string,
): Promise<AdminOperatorRow> {
  void _accessToken
  const user = ensurePortal(id)
  const option = findPrefeituraCredentialUbtOption(targetUbtId)
  if (!option) {
    throw new PrefeituraCredenciaisApiError('UBT de destino inválida.', 400, 'INVALID_UBT')
  }
  user.ubtId = option.value
  user.ubtName = option.ubtName
  user.unitName = option.ubtName
  user.raKey = option.raKey
  user.raLabel = option.raLabel
  user.isUbtResponsible = false
  return mockDelay(clone(user), 70)
}

export async function verifyPrefeituraPortalResponsiblePin(
  _accessToken: string,
  _userId: string,
  pin: string,
): Promise<void> {
  void _accessToken
  void _userId
  if (!isValidMockAuthorizationPin(pin)) {
    throw new PrefeituraCredenciaisApiError('PIN inválido.', 401, 'INVALID_PIN')
  }
  return mockDelay(undefined)
}

export async function fetchPrefeituraGestorCredentials(
  _accessToken: string,
): Promise<PrefeituraCredentialUser[]> {
  void _accessToken
  return mockDelay(clone(gestorState), 60)
}

export async function createPrefeituraGestorCredential(
  _accessToken: string,
  body: {
    name: string
    email: string
    cpf: string
    role: string
    accessLevel: string
    status: 'ativo' | 'inativo'
    pagePermissions: PrefeituraCredentialUser['pagePermissions']
    password: string
    authorizationPin?: string
  },
): Promise<PrefeituraCredentialUser> {
  void _accessToken
  const entity = adminOperatorsInitialRows[0]?.contractingEntity!
  const user: PrefeituraCredentialUser = {
    id: `pref-gestor-${Date.now()}`,
    name: body.name,
    email: body.email,
    cpf: body.cpf,
    role: body.role,
    contractingEntityId: entity.id,
    contractingEntity: entity,
    accessLevel: body.accessLevel as PrefeituraCredentialUser['accessLevel'],
    status: body.status,
    initials: body.name.slice(0, 2).toUpperCase(),
    avatarClassName: 'bg-violet-100 text-violet-700',
    hasPassword: Boolean(body.password),
    hasAuthorizationPin: Boolean(body.authorizationPin),
    lastAccessLabel: 'Sem acesso recente',
    pagePermissions: body.pagePermissions,
  }
  gestorState = [user, ...gestorState]
  return mockDelay(clone(user), 70)
}

export async function updatePrefeituraGestorCredential(
  _accessToken: string,
  id: string,
  body: {
    name?: string
    email?: string
    cpf?: string
    role?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    pagePermissions?: PrefeituraCredentialUser['pagePermissions']
    password?: string
    authorizationPin?: string | null
  },
): Promise<PrefeituraCredentialUser> {
  void _accessToken
  const user = ensureGestor(id)
  Object.assign(user, body)
  if (body.authorizationPin !== undefined) user.hasAuthorizationPin = Boolean(body.authorizationPin)
  if (body.password !== undefined) user.hasPassword = Boolean(body.password)
  return mockDelay(clone(user), 70)
}

export async function deactivatePrefeituraGestorCredential(
  _accessToken: string,
  id: string,
): Promise<PrefeituraCredentialUser> {
  void _accessToken
  const user = ensureGestor(id)
  user.status = 'inativo'
  return mockDelay(clone(user), 70)
}

export async function activatePrefeituraGestorCredential(
  _accessToken: string,
  id: string,
): Promise<PrefeituraCredentialUser> {
  void _accessToken
  const user = ensureGestor(id)
  user.status = 'ativo'
  return mockDelay(clone(user), 70)
}

export async function deletePrefeituraGestorCredential(
  _accessToken: string,
  id: string,
): Promise<void> {
  void _accessToken
  gestorState = gestorState.filter((item) => item.id !== id)
  return mockDelay(undefined, 60)
}

function filterAccessLogs(query?: PrefeituraCredentialsAccessLogsQuery) {
  let entries: AuditLogEntry[] = auditLogsAllEntries.filter(
    (entry) =>
      entry.platform === 'prefeitura' &&
      (entry.kind === 'acesso' || entry.actionTone === 'auth'),
  )

  if (query?.search?.trim()) {
    const needle = query.search.trim().toLowerCase()
    entries = entries.filter((entry) =>
      [entry.userName, entry.actionLabel, entry.moduleName].join(' ').toLowerCase().includes(needle),
    )
  }
  if (query?.portal) {
    entries = entries.filter((entry) => entry.platform === query.portal)
  }
  if (query?.acao) {
    entries = entries.filter((entry) => entry.actionLabel.toLowerCase().includes(query.acao!))
  }
  if (query?.atorId) {
    entries = entries.filter((entry) => entry.resourceId === query.atorId)
  }

  const total = entries.length
  const limit = query?.limit && query.limit > 0 ? query.limit : total
  const offset = query?.offset && query.offset >= 0 ? query.offset : 0
  return { entries: entries.slice(offset, offset + limit), total }
}

export async function fetchPrefeituraCredenciaisAccessLogs(
  _accessToken: string,
  query?: PrefeituraCredentialsAccessLogsQuery,
): Promise<{ entries: AuditLogEntry[]; total: number }> {
  void _accessToken
  return mockDelay(filterAccessLogs(query), 60)
}
