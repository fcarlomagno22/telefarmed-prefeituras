import { CredenciaisError } from './errors.js'
import {
  activatePrefeituraCredential,
  createPrefeituraCredential,
  deactivatePrefeituraCredential,
  deletePrefeituraCredential,
  getPrefeituraCredentialById,
  listPrefeituraCredentials,
  updatePrefeituraCredential,
} from './prefeitura.service.js'
import type { AdminPortalUserDto } from './types.js'
import {
  activateUbtCredential,
  createUbtCredential,
  deactivateUbtCredential,
  deleteUbtCredential,
  getUbtCredentialById,
  listUbtCredentials,
  transferUbtCredentialUbt,
  updateUbtCredential,
  verifyUbtResponsiblePin,
} from './ubt.service.js'

async function resolvePortalCredentialById(id: string): Promise<AdminPortalUserDto> {
  try {
    return await getPrefeituraCredentialById(id)
  } catch (error) {
    if (error instanceof CredenciaisError && error.code === 'NOT_FOUND') {
      return getUbtCredentialById(id)
    }
    throw error
  }
}

export async function listPortalCredentials(filters: {
  scope: 'Prefeitura' | 'UBT'
  search?: string
  profile?: string
  ubtId?: string
  contractingEntityId?: string
  status?: 'ativo' | 'inativo'
}): Promise<AdminPortalUserDto[]> {
  if (filters.scope === 'Prefeitura') {
    return listPrefeituraCredentials(filters)
  }
  return listUbtCredentials(filters)
}

export async function getPortalCredentialById(id: string): Promise<AdminPortalUserDto> {
  return resolvePortalCredentialById(id)
}

export async function createPortalCredential(input: {
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
  pagePermissions?: unknown
  password: string
  authorizationPin?: string
}): Promise<AdminPortalUserDto> {
  if (input.scope === 'Prefeitura') {
    if (!input.cpf?.trim()) {
      throw new CredenciaisError('Informe o CPF do gestor.', 'INVALID_DATA', 400)
    }
    return createPrefeituraCredential({
      name: input.name,
      email: input.email,
      cpf: input.cpf,
      role: input.role,
      accessLevel: input.accessLevel,
      status: input.status,
      contractingEntityId: input.contractingEntityId,
      pagePermissions: input.pagePermissions,
      password: input.password,
      authorizationPin: input.authorizationPin,
    })
  }

  return createUbtCredential(input)
}

export async function updatePortalCredential(
  id: string,
  input: {
    name?: string
    email?: string
    cpf?: string
    role?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    contractingEntityId?: string
    ubtId?: string
    isUbtResponsible?: boolean
    pagePermissions?: unknown
    password?: string
    authorizationPin?: string | null
  },
): Promise<AdminPortalUserDto> {
  const existing = await resolvePortalCredentialById(id)

  if (existing.scope === 'Prefeitura') {
    return updatePrefeituraCredential(id, input)
  }

  return updateUbtCredential(id, input)
}

export async function deactivatePortalCredential(id: string): Promise<AdminPortalUserDto> {
  const existing = await resolvePortalCredentialById(id)
  if (existing.scope === 'Prefeitura') {
    return deactivatePrefeituraCredential(id)
  }
  return deactivateUbtCredential(id)
}

export async function activatePortalCredential(id: string): Promise<AdminPortalUserDto> {
  const existing = await resolvePortalCredentialById(id)
  if (existing.scope === 'Prefeitura') {
    return activatePrefeituraCredential(id)
  }
  return activateUbtCredential(id)
}

export async function deletePortalCredential(id: string): Promise<void> {
  const existing = await resolvePortalCredentialById(id)
  if (existing.scope === 'Prefeitura') {
    await deletePrefeituraCredential(id)
    return
  }
  await deleteUbtCredential(id)
}

export async function transferPortalCredentialUbt(
  id: string,
  targetUbtId: string,
): Promise<AdminPortalUserDto> {
  const existing = await resolvePortalCredentialById(id)
  if (existing.scope !== 'UBT') {
    throw new CredenciaisError('Transferência de UBT só se aplica a operadores de unidade.', 'INVALID_DATA', 400)
  }
  return transferUbtCredentialUbt(id, targetUbtId)
}

export async function verifyPortalResponsiblePin(input: {
  userId: string
  pin: string
}): Promise<{ ok: true }> {
  const existing = await resolvePortalCredentialById(input.userId)
  if (existing.scope !== 'UBT') {
    throw new CredenciaisError(
      'Validação de PIN do responsável só se aplica a operadores de UBT.',
      'INVALID_DATA',
      400,
    )
  }
  return verifyUbtResponsiblePin(input)
}
