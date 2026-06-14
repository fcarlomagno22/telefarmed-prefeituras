import type { AdminInternoCredentialUser } from '../../../config/adminCredenciaisConfig'
import type { PrefeituraCredentialUser } from '../../../config/prefeituraCredenciaisConfig'
import { adminInternoCredentialsInitial } from '../../../data/adminCredenciaisMock'
import type { AdminOperatorRow } from '../../../data/adminOperadoresMock'
import { adminOperatorsInitialRows } from '../../../data/adminOperadoresMock'
import type { PrefeituraCredentialUbtOption } from '../../../data/prefeituraAccessCredentialsMock'
import { prefeituraCredentialsUbtOptions } from '../../../data/prefeituraAccessCredentialsMock'
import { adminClientesRows } from '../../../data/adminClientesMock'
import { isValidMockAuthorizationPin } from '../../mockAuth/mockAuthCredentials'
import { mockDelay } from '../delay'

export type CredenciaisKpis = {
  internosTotal: number
  prefeituraTotal: number
  ubtTotal: number
  ativosRedeTotal: number
}

export class AdminCredenciaisApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminCredenciaisApiError'
    this.status = status
    this.code = code
  }
}

let internoState: AdminInternoCredentialUser[] = JSON.parse(
  JSON.stringify(adminInternoCredentialsInitial),
)
let portalState: AdminOperatorRow[] = JSON.parse(JSON.stringify(adminOperatorsInitialRows))

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function ensureInterno(id: string) {
  const found = internoState.find((item) => item.id === id)
  if (!found) throw new AdminCredenciaisApiError('Credencial interna não encontrada.', 404)
  return found
}

function ensurePortal(id: string) {
  const found = portalState.find((item) => item.id === id)
  if (!found) throw new AdminCredenciaisApiError('Credencial de portal não encontrada.', 404)
  return found
}

export async function fetchCredenciaisKpis(_accessToken: string): Promise<CredenciaisKpis> {
  void _accessToken
  const prefeituraTotal = portalState.filter((item) => item.scope === 'Prefeitura').length
  const ubtTotal = portalState.filter((item) => item.scope === 'UBT').length
  const ativosRedeTotal =
    internoState.filter((item) => item.status === 'ativo').length +
    portalState.filter((item) => item.status === 'ativo').length
  return mockDelay(
    {
      internosTotal: internoState.length,
      prefeituraTotal,
      ubtTotal,
      ativosRedeTotal,
    },
    60,
  )
}

export async function fetchInternoCredentials(
  _accessToken: string,
): Promise<AdminInternoCredentialUser[]> {
  void _accessToken
  return mockDelay(clone(internoState), 60)
}

export async function fetchInternoCredentialDetail(
  _accessToken: string,
  id: string,
): Promise<AdminInternoCredentialUser> {
  void _accessToken
  return mockDelay(clone(ensureInterno(id)), 50)
}

export async function createInternoCredential(
  _accessToken: string,
  body: {
    name: string
    email: string
    cpf: string
    role: string
    departmentId: string
    accessLevel: string
    status: 'ativo' | 'inativo'
    pagePermissions: AdminInternoCredentialUser['pagePermissions']
    password: string
    authorizationPin?: string
  },
): Promise<AdminInternoCredentialUser> {
  void _accessToken
  const user: AdminInternoCredentialUser = {
    id: `adm-cred-${Date.now()}`,
    name: body.name,
    email: body.email,
    cpf: body.cpf,
    role: body.role,
    departmentId: body.departmentId as AdminInternoCredentialUser['departmentId'],
    accessLevel: body.accessLevel as AdminInternoCredentialUser['accessLevel'],
    status: body.status,
    initials: body.name.slice(0, 2).toUpperCase(),
    avatarClassName: 'bg-sky-100 text-sky-700',
    hasPassword: Boolean(body.password),
    hasAuthorizationPin: Boolean(body.authorizationPin),
    lastAccessLabel: 'Sem acesso recente',
    pagePermissions: body.pagePermissions,
  }
  internoState = [user, ...internoState]
  return mockDelay(clone(user), 70)
}

export async function updateInternoCredential(
  _accessToken: string,
  id: string,
  body: {
    name?: string
    email?: string
    cpf?: string
    role?: string
    departmentId?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    pagePermissions?: AdminInternoCredentialUser['pagePermissions']
    password?: string
    authorizationPin?: string | null
  },
): Promise<AdminInternoCredentialUser> {
  void _accessToken
  const user = ensureInterno(id)
  Object.assign(user, body)
  if (body.authorizationPin !== undefined) user.hasAuthorizationPin = Boolean(body.authorizationPin)
  if (body.password !== undefined) user.hasPassword = Boolean(body.password)
  return mockDelay(clone(user), 70)
}

export async function deactivateInternoCredential(
  _accessToken: string,
  id: string,
): Promise<AdminInternoCredentialUser> {
  void _accessToken
  const user = ensureInterno(id)
  user.status = 'inativo'
  return mockDelay(clone(user), 70)
}

export async function activateInternoCredential(
  _accessToken: string,
  id: string,
): Promise<AdminInternoCredentialUser> {
  void _accessToken
  const user = ensureInterno(id)
  user.status = 'ativo'
  return mockDelay(clone(user), 70)
}

export async function deleteInternoCredential(_accessToken: string, id: string): Promise<void> {
  void _accessToken
  internoState = internoState.filter((item) => item.id !== id)
  return mockDelay(undefined, 60)
}

export async function fetchPrefeituraCredentials(
  _accessToken: string,
): Promise<PrefeituraCredentialUser[]> {
  void _accessToken
  return mockDelay(
    clone(
      portalState.filter((item) => item.scope === 'Prefeitura').map((item) => ({
        ...item,
        cpf: item.cpf ?? '',
        contractingEntityId: item.contractingEntity.id,
        contractingEntity: item.contractingEntity,
      })),
    ) as PrefeituraCredentialUser[],
    60,
  )
}

export async function createPrefeituraCredential(
  accessToken: string,
  body: {
    name: string
    email: string
    cpf: string
    role: string
    accessLevel: string
    status: 'ativo' | 'inativo'
    contractingEntityId: string
    pagePermissions: PrefeituraCredentialUser['pagePermissions']
    password: string
    authorizationPin?: string
  },
): Promise<PrefeituraCredentialUser> {
  const created = await createPortalCredential(accessToken, {
    scope: 'Prefeitura',
    ...body,
    pagePermissions: body.pagePermissions as AdminOperatorRow['pagePermissions'],
  })
  return {
    ...created,
    cpf: created.cpf ?? body.cpf,
    contractingEntityId: created.contractingEntity.id,
    contractingEntity: created.contractingEntity,
  } as PrefeituraCredentialUser
}

export async function updatePrefeituraCredential(
  accessToken: string,
  id: string,
  body: {
    name?: string
    email?: string
    cpf?: string
    role?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    contractingEntityId?: string
    pagePermissions?: PrefeituraCredentialUser['pagePermissions']
    password?: string
    authorizationPin?: string | null
  },
): Promise<PrefeituraCredentialUser> {
  const updated = await updatePortalCredential(accessToken, id, {
    ...body,
    pagePermissions: body.pagePermissions as AdminOperatorRow['pagePermissions'],
  })
  return {
    ...updated,
    cpf: updated.cpf ?? '',
    contractingEntityId: updated.contractingEntity.id,
    contractingEntity: updated.contractingEntity,
  } as PrefeituraCredentialUser
}

export async function deactivatePrefeituraCredential(
  accessToken: string,
  id: string,
): Promise<PrefeituraCredentialUser> {
  const user = await deactivatePortalCredential(accessToken, id)
  return {
    ...user,
    cpf: user.cpf ?? '',
    contractingEntityId: user.contractingEntity.id,
    contractingEntity: user.contractingEntity,
  } as PrefeituraCredentialUser
}

export async function activatePrefeituraCredential(
  accessToken: string,
  id: string,
): Promise<PrefeituraCredentialUser> {
  const user = await activatePortalCredential(accessToken, id)
  return {
    ...user,
    cpf: user.cpf ?? '',
    contractingEntityId: user.contractingEntity.id,
    contractingEntity: user.contractingEntity,
  } as PrefeituraCredentialUser
}

export async function deletePrefeituraCredential(accessToken: string, id: string): Promise<void> {
  return deletePortalCredential(accessToken, id)
}

export type PortalCredentialsListParams = {
  search?: string
  profile?: string
  status?: 'ativo' | 'inativo'
  ubtId?: string
  contractingEntityId?: string
}

export async function fetchPortalCredentials(
  _accessToken: string,
  scope: 'Prefeitura' | 'UBT',
  params: PortalCredentialsListParams = {},
): Promise<AdminOperatorRow[]> {
  void _accessToken
  const search = params.search?.trim().toLowerCase()
  return mockDelay(
    clone(
      portalState.filter((row) => {
        if (row.scope !== scope) return false
        if (params.status && row.status !== params.status) return false
        if (params.profile && row.role !== params.profile) return false
        if (params.ubtId && row.ubtId !== params.ubtId) return false
        if (params.contractingEntityId && row.contractingEntity.id !== params.contractingEntityId) {
          return false
        }
        if (search && ![row.name, row.email, row.role].some((value) => value.toLowerCase().includes(search))) {
          return false
        }
        return true
      }),
    ),
    70,
  )
}

export async function fetchPortalCredentialDetail(
  _accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  void _accessToken
  return mockDelay(clone(ensurePortal(id)), 50)
}

export async function fetchPrefeituraCredentialDetail(
  _accessToken: string,
  id: string,
): Promise<PrefeituraCredentialUser> {
  void _accessToken
  const row = ensurePortal(id)
  return mockDelay(
    clone({
      ...row,
      cpf: row.cpf ?? '',
      contractingEntityId: row.contractingEntity.id,
      contractingEntity: row.contractingEntity,
    }) as PrefeituraCredentialUser,
    50,
  )
}

export async function createPortalCredential(
  _accessToken: string,
  body: {
    scope: 'Prefeitura' | 'UBT'
    name: string
    email: string
    cpf?: string
    role: string
    accessLevel: string
    status: 'ativo' | 'inativo'
    contractingEntityId: string
    ubtId?: string
    isUbtResponsible?: boolean
    pagePermissions: AdminOperatorRow['pagePermissions']
    password: string
    authorizationPin?: string
  },
): Promise<AdminOperatorRow> {
  void _accessToken
  const entity =
    adminClientesRows.find((row) => row.id === body.contractingEntityId) ??
    adminClientesRows[0]
  const user: AdminOperatorRow = {
    id: `op-${Date.now()}`,
    name: body.name,
    email: body.email,
    cpf: body.cpf,
    role: body.role,
    accessLevel: body.accessLevel as AdminOperatorRow['accessLevel'],
    status: body.status,
    initials: body.name.slice(0, 2).toUpperCase(),
    avatarClassName: 'bg-emerald-100 text-emerald-700',
    hasPassword: Boolean(body.password),
    hasAuthorizationPin: Boolean(body.authorizationPin),
    pagePermissions: body.pagePermissions,
    ubtId: body.ubtId,
    ubtName: body.ubtId ?? 'UBT Central',
    raKey: 'central',
    raLabel: 'RA Central',
    isUbtResponsible: body.isUbtResponsible,
    scope: body.scope,
    unitName: body.ubtId ?? 'UBT Central',
    contractingEntity: {
      id: entity.id,
      razaoSocial: entity.razaoSocial,
      municipality: entity.municipio,
      uf: entity.uf,
    },
    lastAccessLabel: 'Sem acesso recente',
    profileLabel: body.role,
  }
  portalState = [user, ...portalState]
  return mockDelay(clone(user), 80)
}

export async function updatePortalCredential(
  _accessToken: string,
  id: string,
  body: {
    name?: string
    email?: string
    role?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    contractingEntityId?: string
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
  if (body.contractingEntityId) {
    const entity = adminClientesRows.find((row) => row.id === body.contractingEntityId)
    if (entity) {
      user.contractingEntity = {
        id: entity.id,
        razaoSocial: entity.razaoSocial,
        municipality: entity.municipio,
        uf: entity.uf,
      }
    }
  }
  if (body.authorizationPin !== undefined) user.hasAuthorizationPin = Boolean(body.authorizationPin)
  if (body.password !== undefined) user.hasPassword = Boolean(body.password)
  return mockDelay(clone(user), 70)
}

export async function deactivatePortalCredential(
  _accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  void _accessToken
  const user = ensurePortal(id)
  user.status = 'inativo'
  return mockDelay(clone(user), 70)
}

export async function activatePortalCredential(
  _accessToken: string,
  id: string,
): Promise<AdminOperatorRow> {
  void _accessToken
  const user = ensurePortal(id)
  user.status = 'ativo'
  return mockDelay(clone(user), 70)
}

export async function deletePortalCredential(_accessToken: string, id: string): Promise<void> {
  void _accessToken
  portalState = portalState.filter((item) => item.id !== id)
  return mockDelay(undefined, 60)
}

export async function transferPortalCredentialUbt(
  _accessToken: string,
  id: string,
  targetUbtId: string,
): Promise<AdminOperatorRow> {
  void _accessToken
  const user = ensurePortal(id)
  user.ubtId = targetUbtId
  user.ubtName = targetUbtId
  user.unitName = targetUbtId
  return mockDelay(clone(user), 70)
}

export async function verifyPortalResponsiblePin(
  _accessToken: string,
  _userId: string,
  pin: string,
): Promise<void> {
  void _accessToken
  if (!isValidMockAuthorizationPin(pin)) {
    throw new AdminCredenciaisApiError('PIN inválido.', 400)
  }
  return mockDelay(undefined, 50)
}

export async function fetchContractingEntities(_accessToken: string) {
  void _accessToken
  return mockDelay(
    clone(
      adminClientesRows.map((row) => ({
        id: row.id,
        razaoSocial: row.razaoSocial,
        municipality: row.municipio,
        uf: row.uf,
        label: `${row.prefeitura} · ${row.municipio}/${row.uf}`,
      })),
    ),
    60,
  )
}

export async function fetchUbtOptions(
  _accessToken: string,
): Promise<PrefeituraCredentialUbtOption[]> {
  void _accessToken
  return mockDelay(clone(prefeituraCredentialsUbtOptions), 60)
}

export async function fetchUbtOptionsByEntity(
  _accessToken: string,
  entityId: string,
): Promise<PrefeituraCredentialUbtOption[]> {
  void _accessToken
  return mockDelay(
    clone(
      prefeituraCredentialsUbtOptions.map((option) => ({
        ...option,
        contractingEntityId: entityId,
      })),
    ),
    60,
  )
}

export function isCredenciaisApiError(error: unknown): error is AdminCredenciaisApiError {
  return error instanceof AdminCredenciaisApiError
}

export { AdminCredenciaisApiError as AdminAuthApiError }
