import {
  activatePrefeituraCredential,
  createPrefeituraCredential,
  deactivatePrefeituraCredential,
  deletePrefeituraCredential,
  listPrefeituraCredentials,
  updatePrefeituraCredential,
} from '../admin-credenciais/prefeitura.service.js'
import { assertGestorInEntity, assertNotSelf } from './ownership.js'

export async function listGestores(entidadeId: string) {
  return listPrefeituraCredentials({ contractingEntityId: entidadeId })
}

export async function createGestor(
  entidadeId: string,
  body: {
    name: string
    email: string
    cpf: string
    role: string
    accessLevel: string
    status: 'ativo' | 'inativo'
    pagePermissions?: unknown
    password: string
    authorizationPin?: string
  },
) {
  return createPrefeituraCredential({
    ...body,
    contractingEntityId: entidadeId,
  })
}

export async function updateGestor(
  entidadeId: string,
  actorId: string,
  gestorId: string,
  body: {
    name?: string
    email?: string
    cpf?: string
    role?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    pagePermissions?: unknown
    password?: string
    authorizationPin?: string | null
  },
) {
  await assertGestorInEntity(gestorId, entidadeId)

  if (body.status === 'inativo') {
    assertNotSelf(actorId, gestorId, 'desativar')
  }

  return updatePrefeituraCredential(gestorId, body)
}

export async function deactivateGestor(entidadeId: string, actorId: string, gestorId: string) {
  await assertGestorInEntity(gestorId, entidadeId)
  assertNotSelf(actorId, gestorId, 'desativar')
  return deactivatePrefeituraCredential(gestorId)
}

export async function activateGestor(entidadeId: string, gestorId: string) {
  await assertGestorInEntity(gestorId, entidadeId)
  return activatePrefeituraCredential(gestorId)
}

export async function deleteGestor(entidadeId: string, actorId: string, gestorId: string) {
  await assertGestorInEntity(gestorId, entidadeId)
  assertNotSelf(actorId, gestorId, 'excluir')
  await deletePrefeituraCredential(gestorId)
}
