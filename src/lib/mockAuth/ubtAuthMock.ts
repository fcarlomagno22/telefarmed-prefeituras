import type { PermissionAction, SystemPageId } from '../../config/accessCredentials'
import { emptyPagePermissions } from '../../config/accessCredentials'
import { initialAccessCredentialUsers } from '../../data/accessCredentialsMock'
import { prefeituraRedeUnits } from '../../data/prefeituraRedeMock'
import { cpfDigits } from '../../utils/cpf'
import {
  MOCK_AUTH_PASSWORD,
  MOCK_UBT_CPF,
  isValidMockAuthorizationPin,
} from './mockAuthCredentials'
import { createMockAccessToken } from './mockAuthStorage'
import type { EntidadeBrandingFields } from '../../types/entidadeBranding'
import { buildDefaultEntidadeBranding } from '../../types/entidadeBranding'

export type UbtSystemPermissions = Record<SystemPageId, PermissionAction[]>

export type UbtAuthUser = {
  id: string
  cpf: string
  nome: string
  email: string | null
  funcao: string
  accessLevel: string
  status: 'ativo' | 'inativo'
  entidadeContratanteId: string
  unidadeUbtId: string
  unidadeUbtNome: string
  entidadeRazaoSocial: string
  municipio: string
  uf: string
  lastLoginAt: string | null
  systemPermissions: UbtSystemPermissions
} & Partial<EntidadeBrandingFields>

export class UbtAuthApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'UbtAuthApiError'
    this.status = status
    this.code = code
  }
}

const SESSION_KEYS = {
  token: 'telefarmed.ubt.accessToken',
  user: 'telefarmed.ubt.user',
} as const

const demoCredential = initialAccessCredentialUsers[0]
const demoUnit = prefeituraRedeUnits.find((unit) => unit.status === 'ativa') ?? prefeituraRedeUnits[0]

function buildDemoUbtUser(): UbtAuthUser {
  if (!demoCredential || !demoUnit) {
    throw new UbtAuthApiError('Usuário demo UBT não configurado.', 500)
  }

  const unidadeUbtId = demoCredential.ubtId ?? demoUnit.id
  const unidadeUbtNome = demoCredential.ubtName ?? demoUnit.name

  return {
    id: demoCredential.id,
    cpf: MOCK_UBT_CPF,
    nome: demoCredential.name,
    email: demoCredential.email,
    funcao: demoCredential.role,
    accessLevel: demoCredential.accessLevel,
    status: demoCredential.status,
    entidadeContratanteId: 'ent-demo-sjc',
    unidadeUbtId,
    unidadeUbtNome,
    entidadeRazaoSocial: 'Prefeitura Municipal de São José dos Campos',
    municipio: 'São José dos Campos',
    uf: 'SP',
    lastLoginAt: new Date().toISOString(),
    systemPermissions: demoCredential.pagePermissions as UbtSystemPermissions,
    ...buildDefaultEntidadeBranding({
      nomeExibicao: 'Prefeitura Municipal de São José dos Campos',
    }),
  }
}

export function readUbtMockSession(): {
  accessToken: string | null
  user: UbtAuthUser | null
} {
  try {
    const accessToken = sessionStorage.getItem(SESSION_KEYS.token)
    const rawUser = sessionStorage.getItem(SESSION_KEYS.user)
    if (!accessToken || !rawUser) {
      return { accessToken: null, user: null }
    }
    const user = JSON.parse(rawUser) as UbtAuthUser
    return {
      accessToken,
      user: {
        ...user,
        systemPermissions:
          user.systemPermissions ?? (emptyPagePermissions() as UbtSystemPermissions),
      },
    }
  } catch {
    return { accessToken: null, user: null }
  }
}

export function writeUbtMockSession(accessToken: string | null, user: UbtAuthUser | null): void {
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

export async function mockUbtLogin(credentials: {
  cpf: string
  password: string
}): Promise<{ accessToken: string; user: UbtAuthUser }> {
  const cpf = cpfDigits(credentials.cpf)
  if (cpf !== MOCK_UBT_CPF || credentials.password !== MOCK_AUTH_PASSWORD) {
    throw new UbtAuthApiError('CPF ou senha inválidos.', 401, 'INVALID_CREDENTIALS')
  }

  const user = buildDemoUbtUser()
  if (user.status !== 'ativo') {
    throw new UbtAuthApiError('Usuário inativo.', 403, 'USER_INACTIVE')
  }

  return {
    accessToken: createMockAccessToken('ubt', user.id),
    user,
  }
}

export async function checkUbtLgpdUnlockStatus(
  _accessToken: string,
  lgpdUnlockToken: string,
): Promise<boolean> {
  void _accessToken
  return lgpdUnlockToken.startsWith('mock.lgpd.')
}

export async function unlockUbtLgpd(
  _accessToken: string,
  pin: string,
): Promise<{ lgpdUnlockToken: string; expiresAt: string }> {
  void _accessToken
  if (!isValidMockAuthorizationPin(pin)) {
    throw new UbtAuthApiError('PIN inválido.', 401, 'INVALID_PIN')
  }

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
  return {
    lgpdUnlockToken: `mock.lgpd.${Date.now()}`,
    expiresAt,
  }
}

export { SESSION_KEYS as ubtMockSessionKeys }
