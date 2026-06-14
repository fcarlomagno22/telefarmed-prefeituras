import {
  activateUbtCredential,
  createUbtCredential,
  deactivateUbtCredential,
  deleteUbtCredential,
  listUbtCredentials,
  updateUbtCredential,
} from '../admin-credenciais/ubt.service.js'
import {
  assertActorCanManage,
  assertNotSelf,
  assertNotTargetResponsible,
  assertOperadorInUbt,
  resolveActorCanManage,
} from './ownership.js'

type UbtScope = {
  unidadeUbtId: string
  entidadeContratanteId: string
  actorId: string
}

export async function listOperadores(
  scope: UbtScope,
  filters: {
    search?: string
    profile?: string
    status?: 'ativo' | 'inativo'
  },
) {
  const [users, canManage] = await Promise.all([
    listUbtCredentials({
      ubtId: scope.unidadeUbtId,
      search: filters.search,
      profile: filters.profile,
      status: filters.status,
    }),
    resolveActorCanManage(scope.actorId),
  ])

  return { users, canManage }
}

export async function getOperador(scope: UbtScope, operadorId: string) {
  return assertOperadorInUbt(operadorId, scope.unidadeUbtId)
}

export async function createOperador(
  scope: UbtScope,
  body: {
    name: string
    email: string
    cpf: string
    role: string
    accessLevel: string
    status: 'ativo' | 'inativo'
    isUbtResponsible?: boolean
    pagePermissions?: unknown
    password: string
    authorizationPin?: string
  },
) {
  await assertActorCanManage(scope.actorId)

  return createUbtCredential({
    ...body,
    contractingEntityId: scope.entidadeContratanteId,
    ubtId: scope.unidadeUbtId,
  })
}

export async function updateOperador(
  scope: UbtScope,
  operadorId: string,
  body: {
    name?: string
    email?: string
    cpf?: string
    role?: string
    accessLevel?: string
    status?: 'ativo' | 'inativo'
    isUbtResponsible?: boolean
    pagePermissions?: unknown
    password?: string
    authorizationPin?: string | null
  },
) {
  await assertActorCanManage(scope.actorId)

  const existing = await assertOperadorInUbt(operadorId, scope.unidadeUbtId)

  if (body.status === 'inativo') {
    assertNotSelf(scope.actorId, operadorId, 'desativar')
    assertNotTargetResponsible(existing, 'desativar')
  }

  if (body.isUbtResponsible === true && operadorId !== scope.actorId) {
    assertNotTargetResponsible(existing, 'alterar o papel de')
  }

  return updateUbtCredential(operadorId, {
    ...body,
    contractingEntityId: scope.entidadeContratanteId,
    ubtId: scope.unidadeUbtId,
  })
}

export async function deactivateOperador(scope: UbtScope, operadorId: string) {
  await assertActorCanManage(scope.actorId)

  const existing = await assertOperadorInUbt(operadorId, scope.unidadeUbtId)
  assertNotSelf(scope.actorId, operadorId, 'desativar')
  assertNotTargetResponsible(existing, 'desativar')

  return deactivateUbtCredential(operadorId)
}

export async function activateOperador(scope: UbtScope, operadorId: string) {
  await assertActorCanManage(scope.actorId)
  await assertOperadorInUbt(operadorId, scope.unidadeUbtId)
  return activateUbtCredential(operadorId)
}

export async function deleteOperador(scope: UbtScope, operadorId: string) {
  await assertActorCanManage(scope.actorId)

  const existing = await assertOperadorInUbt(operadorId, scope.unidadeUbtId)
  assertNotSelf(scope.actorId, operadorId, 'excluir')
  assertNotTargetResponsible(existing, 'excluir')

  await deleteUbtCredential(operadorId)
}
