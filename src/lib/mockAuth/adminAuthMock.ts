import type { AdminPortalPageId } from '../../config/adminCredenciaisConfig'
import { emptyAdminPagePermissions } from '../../config/adminCredenciaisConfig'
import type { PermissionAction } from '../../config/accessCredentials'
import { adminInternoCredentialsInitial } from '../../data/adminCredenciaisMock'
import { cpfDigits } from '../../utils/cpf'
import {
  MOCK_ADMIN_CPF,
  MOCK_AUTH_PASSWORD,
  isValidMockAuthorizationPin,
} from './mockAuthCredentials'
import { createMockAccessToken } from './mockAuthStorage'

export type AdminPagePermissions = Record<AdminPortalPageId, PermissionAction[]>

export type AdminAuthUser = {
  id: string
  cpf: string
  nome: string
  email: string | null
  accessLevel: string
  departmentId: string
  isMaster: boolean
  status: 'ativo' | 'inativo'
  lastLoginAt: string | null
  pagePermissions: AdminPagePermissions
}

export class AdminAuthApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminAuthApiError'
    this.status = status
    this.code = code
  }
}

const SESSION_KEYS = {
  token: 'telefarmed.admin.accessToken',
  user: 'telefarmed.admin.user',
} as const

const demoCredential = adminInternoCredentialsInitial[0]

function buildDemoAdminUser(): AdminAuthUser {
  if (!demoCredential) {
    throw new AdminAuthApiError('Usuário demo admin não configurado.', 500)
  }

  return {
    id: demoCredential.id,
    cpf: MOCK_ADMIN_CPF,
    nome: demoCredential.name,
    email: demoCredential.email,
    accessLevel: demoCredential.accessLevel,
    departmentId: demoCredential.departmentId,
    isMaster: demoCredential.accessLevel === 'administrador',
    status: demoCredential.status,
    lastLoginAt: new Date().toISOString(),
    pagePermissions: demoCredential.pagePermissions,
  }
}

export function readAdminMockSession(): {
  accessToken: string | null
  user: AdminAuthUser | null
} {
  try {
    const accessToken = sessionStorage.getItem(SESSION_KEYS.token)
    const rawUser = sessionStorage.getItem(SESSION_KEYS.user)
    if (!accessToken || !rawUser) {
      return { accessToken: null, user: null }
    }
    const user = JSON.parse(rawUser) as AdminAuthUser
    return {
      accessToken,
      user: {
        ...user,
        pagePermissions: user.pagePermissions ?? emptyAdminPagePermissions(),
      },
    }
  } catch {
    return { accessToken: null, user: null }
  }
}

export function writeAdminMockSession(accessToken: string | null, user: AdminAuthUser | null): void {
  try {
    if (!accessToken || !user) {
      sessionStorage.removeItem(SESSION_KEYS.token)
      sessionStorage.removeItem(SESSION_KEYS.user)
      return
    }
    sessionStorage.setItem(SESSION_KEYS.token, accessToken)
    sessionStorage.setItem(SESSION_KEYS.user, JSON.stringify(user))
  } catch {
    // sessionStorage indisponível
  }
}

export async function mockAdminLogin(credentials: {
  cpf: string
  password: string
}): Promise<{ accessToken: string; user: AdminAuthUser }> {
  const cpf = cpfDigits(credentials.cpf)
  if (cpf !== MOCK_ADMIN_CPF || credentials.password !== MOCK_AUTH_PASSWORD) {
    throw new AdminAuthApiError('CPF ou senha inválidos.', 401, 'INVALID_CREDENTIALS')
  }

  const user = buildDemoAdminUser()
  if (user.status !== 'ativo') {
    throw new AdminAuthApiError('Usuário inativo.', 403, 'USER_INACTIVE')
  }

  return {
    accessToken: createMockAccessToken('admin', user.id),
    user,
  }
}

export async function verifyAdminAuthorizationPin(
  _accessToken: string,
  pin: string,
): Promise<void> {
  if (!isValidMockAuthorizationPin(pin)) {
    throw new AdminAuthApiError('PIN inválido.', 401, 'INVALID_PIN')
  }
}

export { SESSION_KEYS as adminMockSessionKeys }
