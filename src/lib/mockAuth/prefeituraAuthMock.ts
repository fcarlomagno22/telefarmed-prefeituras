import type { PrefeituraPortalPageId } from '../../config/prefeituraCredenciaisConfig'
import {
  buildPrefeituraPagePermissions,
  emptyPrefeituraPagePermissions,
} from '../../config/prefeituraCredenciaisConfig'
import type { PermissionAction } from '../../config/accessCredentials'
import { adminOperatorsInitialRows } from '../../data/adminOperadoresMock'
import { cpfDigits } from '../../utils/cpf'
import {
  MOCK_AUTH_PASSWORD,
  MOCK_PREFEITURA_CPF,
  isValidMockAuthorizationPin,
} from './mockAuthCredentials'
import { createMockAccessToken } from './mockAuthStorage'

export type PrefeituraPagePermissions = Record<PrefeituraPortalPageId, PermissionAction[]>

export type PrefeituraAuthUser = {
  id: string
  cpf: string
  nome: string
  email: string | null
  funcao: string
  accessLevel: string
  status: 'ativo' | 'inativo'
  entidadeContratanteId: string
  entidadeRazaoSocial: string
  municipio: string
  uf: string
  lastLoginAt: string | null
  pagePermissions: PrefeituraPagePermissions
}

export class PrefeituraAuthApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PrefeituraAuthApiError'
    this.status = status
    this.code = code
  }
}

const SESSION_KEYS = {
  token: 'telefarmed.prefeitura.accessToken',
  user: 'telefarmed.prefeitura.user',
} as const

const demoOperator =
  adminOperatorsInitialRows.find((row) => row.scope === 'Prefeitura') ??
  adminOperatorsInitialRows[0]

function buildDemoPrefeituraUser(): PrefeituraAuthUser {
  if (!demoOperator) {
    throw new PrefeituraAuthApiError('Usuário demo prefeitura não configurado.', 500)
  }

  const accessLevel = demoOperator.accessLevel

  return {
    id: demoOperator.id,
    cpf: MOCK_PREFEITURA_CPF,
    nome: demoOperator.name,
    email: demoOperator.email,
    funcao: demoOperator.role,
    accessLevel,
    status: demoOperator.status,
    entidadeContratanteId: demoOperator.contractingEntity.id,
    entidadeRazaoSocial: demoOperator.contractingEntity.razaoSocial,
    municipio: demoOperator.contractingEntity.municipality,
    uf: demoOperator.contractingEntity.uf,
    lastLoginAt: new Date().toISOString(),
    pagePermissions: buildPrefeituraPagePermissions(accessLevel),
  }
}

export function readPrefeituraMockSession(): {
  accessToken: string | null
  user: PrefeituraAuthUser | null
} {
  try {
    const accessToken = sessionStorage.getItem(SESSION_KEYS.token)
    const rawUser = sessionStorage.getItem(SESSION_KEYS.user)
    if (!accessToken || !rawUser) {
      return { accessToken: null, user: null }
    }
    const user = JSON.parse(rawUser) as PrefeituraAuthUser
    return {
      accessToken,
      user: {
        ...user,
        pagePermissions: user.pagePermissions ?? emptyPrefeituraPagePermissions(),
      },
    }
  } catch {
    return { accessToken: null, user: null }
  }
}

export function writePrefeituraMockSession(
  accessToken: string | null,
  user: PrefeituraAuthUser | null,
): void {
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

export async function mockPrefeituraLogin(credentials: {
  cpf: string
  password: string
}): Promise<{ accessToken: string; user: PrefeituraAuthUser }> {
  const cpf = cpfDigits(credentials.cpf)
  if (cpf !== MOCK_PREFEITURA_CPF || credentials.password !== MOCK_AUTH_PASSWORD) {
    throw new PrefeituraAuthApiError('CPF ou senha inválidos.', 401, 'INVALID_CREDENTIALS')
  }

  const user = buildDemoPrefeituraUser()
  if (user.status !== 'ativo') {
    throw new PrefeituraAuthApiError('Usuário inativo.', 403, 'USER_INACTIVE')
  }

  return {
    accessToken: createMockAccessToken('prefeitura', user.id),
    user,
  }
}

export async function verifyPrefeituraAuthorizationPin(
  _accessToken: string,
  pin: string,
): Promise<void> {
  if (!isValidMockAuthorizationPin(pin)) {
    throw new PrefeituraAuthApiError('PIN inválido.', 401, 'INVALID_PIN')
  }
}

export { SESSION_KEYS as prefeituraMockSessionKeys }
