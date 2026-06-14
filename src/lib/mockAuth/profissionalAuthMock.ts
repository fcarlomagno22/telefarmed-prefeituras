import type { ProfissionalPortalPageId } from '../../config/profissionalCredenciaisConfig'
import {
  emptyProfissionalPagePermissions,
  profissionalPortalPages,
  type ProfissionalPagePermissions,
} from '../../config/profissionalCredenciaisConfig'
import type { PermissionAction } from '../../config/accessCredentials'
import { profissionalLoggedProfile } from '../../data/profissionalPerfilMock'
import { cpfDigits } from '../../utils/cpf'
import {
  MOCK_AUTH_PASSWORD,
  MOCK_PROFISSIONAL_CPF,
} from './mockAuthCredentials'
import { createMockAccessToken } from './mockAuthStorage'

export type ProfissionalSexo = 'masculino' | 'feminino' | 'nao_informado'

export type ProfissionalAuthUser = {
  id: string
  cpf: string
  nome: string
  email: string | null
  specialty: string
  sexo: ProfissionalSexo
  status: 'ativo' | 'inativo'
  lastLoginAt: string | null
  pagePermissions: ProfissionalPagePermissions
}

export class ProfissionalAuthApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ProfissionalAuthApiError'
    this.status = status
    this.code = code
  }
}

const SESSION_KEYS = {
  token: 'telefarmed.profissional.accessToken',
  user: 'telefarmed.profissional.user',
} as const

function buildDemoProfissionalUser(): ProfissionalAuthUser {
  const profile = profissionalLoggedProfile
  const allActions: PermissionAction[] = ['visualizar', 'inserir', 'editar', 'excluir']
  const pagePermissions = Object.fromEntries(
    profissionalPortalPages.map((page) => [page.id, [...allActions]]),
  ) as Record<ProfissionalPortalPageId, PermissionAction[]>

  return {
    id: profile.id,
    cpf: MOCK_PROFISSIONAL_CPF,
    nome: profile.fullName,
    email: profile.email,
    specialty: profile.specialty,
    sexo: 'feminino',
    status: 'ativo',
    lastLoginAt: new Date().toISOString(),
    pagePermissions,
  }
}

export function readProfissionalMockSession(): {
  accessToken: string | null
  user: ProfissionalAuthUser | null
} {
  try {
    const accessToken = sessionStorage.getItem(SESSION_KEYS.token)
    const rawUser = sessionStorage.getItem(SESSION_KEYS.user)
    if (!accessToken || !rawUser) {
      return { accessToken: null, user: null }
    }
    const user = JSON.parse(rawUser) as ProfissionalAuthUser
    return {
      accessToken,
      user: {
        ...user,
        sexo: user.sexo ?? 'nao_informado',
        pagePermissions: user.pagePermissions ?? emptyProfissionalPagePermissions(),
      },
    }
  } catch {
    return { accessToken: null, user: null }
  }
}

export function writeProfissionalMockSession(
  accessToken: string | null,
  user: ProfissionalAuthUser | null,
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

export async function mockProfissionalLogin(credentials: {
  cpf: string
  password: string
}): Promise<{ accessToken: string; user: ProfissionalAuthUser }> {
  const cpf = cpfDigits(credentials.cpf)
  if (cpf !== MOCK_PROFISSIONAL_CPF || credentials.password !== MOCK_AUTH_PASSWORD) {
    throw new ProfissionalAuthApiError('CPF ou senha inválidos.', 401, 'INVALID_CREDENTIALS')
  }

  const user = buildDemoProfissionalUser()
  return {
    accessToken: createMockAccessToken('profissional', user.id),
    user,
  }
}

export { SESSION_KEYS as profissionalMockSessionKeys }
