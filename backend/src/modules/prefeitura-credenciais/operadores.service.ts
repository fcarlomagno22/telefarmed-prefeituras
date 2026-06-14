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
} from '../admin-credenciais/ubt.service.js'
import { assertNotSelf, assertOperadorInEntity } from './ownership.js'

export async function listOperadores(entidadeId: string) {
  return listUbtCredentials({ contractingEntityId: entidadeId })
}

export async function getOperador(entidadeId: string, operadorId: string) {
  return assertOperadorInEntity(operadorId, entidadeId)
}

export async function createOperador(
  entidadeId: string,
  body: {
    name: string
    email: string
    cpf: string
    role: string
    accessLevel: string
    status: 'ativo' | 'inativo'
    ubtId: string
    isUbtResponsible?: boolean
    pagePermissions?: unknown
    password: string
    authorizationPin?: string
  },
) {
  return createUbtCredential({
    ...body,
    contractingEntityId: entidadeId,
  })
}

export async function updateOperador(
  entidadeId: string,
  actorId: string,
  operadorId: string,
  body: {
    name?: string
    email?: string
    cpf?: string
    role?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    ubtId?: string
    isUbtResponsible?: boolean
    pagePermissions?: unknown
    password?: string
    authorizationPin?: string | null
  },
) {
  await assertOperadorInEntity(operadorId, entidadeId)

  if (body.status === 'inativo') {
    assertNotSelf(actorId, operadorId, 'desativar')
  }

  return updateUbtCredential(operadorId, {
    ...body,
    contractingEntityId: entidadeId,
  })
}

export async function deactivateOperador(entidadeId: string, actorId: string, operadorId: string) {
  await assertOperadorInEntity(operadorId, entidadeId)
  assertNotSelf(actorId, operadorId, 'desativar')
  return deactivateUbtCredential(operadorId)
}

export async function activateOperador(entidadeId: string, operadorId: string) {
  await assertOperadorInEntity(operadorId, entidadeId)
  return activateUbtCredential(operadorId)
}

export async function deleteOperador(entidadeId: string, actorId: string, operadorId: string) {
  await assertOperadorInEntity(operadorId, entidadeId)
  assertNotSelf(actorId, operadorId, 'excluir')
  await deleteUbtCredential(operadorId)
}

export async function transferOperadorUbt(
  entidadeId: string,
  operadorId: string,
  targetUbtId: string,
) {
  await assertOperadorInEntity(operadorId, entidadeId)
  const user = await transferUbtCredentialUbt(operadorId, targetUbtId)
  if (user.contractingEntity.id !== entidadeId) {
    return getUbtCredentialById(operadorId)
  }
  return user
}

export async function verifyOperadorResponsiblePin(
  entidadeId: string,
  input: { userId: string; pin: string },
) {
  await assertOperadorInEntity(input.userId, entidadeId)
  return verifyUbtResponsiblePin(input)
}
