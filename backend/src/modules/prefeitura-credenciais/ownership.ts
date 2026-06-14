import {
  getPrefeituraCredentialById,
} from '../admin-credenciais/prefeitura.service.js'
import { getUbtCredentialById } from '../admin-credenciais/ubt.service.js'
import { CredenciaisError } from './errors.js'

export async function assertGestorInEntity(gestorId: string, entidadeId: string) {
  const user = await getPrefeituraCredentialById(gestorId)
  if (user.contractingEntity.id !== entidadeId) {
    throw new CredenciaisError('Gestor não encontrado.', 'NOT_FOUND', 404)
  }
  return user
}

export async function assertOperadorInEntity(operadorId: string, entidadeId: string) {
  const user = await getUbtCredentialById(operadorId)
  if (user.contractingEntity.id !== entidadeId) {
    throw new CredenciaisError('Operador não encontrado.', 'NOT_FOUND', 404)
  }
  return user
}

export function assertNotSelf(actorId: string, targetId: string, actionLabel: string): void {
  if (actorId === targetId) {
    throw new CredenciaisError(
      `Você não pode ${actionLabel} a própria credencial.`,
      'FORBIDDEN',
      403,
    )
  }
}
