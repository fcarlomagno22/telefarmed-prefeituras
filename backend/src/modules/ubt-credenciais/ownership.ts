import { supabaseAdmin } from '../../db/supabase.js'
import { getUbtCredentialById } from '../admin-credenciais/ubt.service.js'
import { CredenciaisError } from './errors.js'

export async function assertOperadorInUbt(operadorId: string, unidadeUbtId: string) {
  const user = await getUbtCredentialById(operadorId)
  if (user.ubtId !== unidadeUbtId) {
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

export function assertNotTargetResponsible(
  target: { isUbtResponsible?: boolean; name: string },
  actionLabel: string,
): void {
  if (target.isUbtResponsible) {
    throw new CredenciaisError(
      `Não é possível ${actionLabel} o responsável pela UBT (${target.name}).`,
      'FORBIDDEN',
      403,
    )
  }
}

export async function resolveActorCanManage(actorId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_ubt')
    .select('eh_responsavel_ubt, nivel_acesso')
    .eq('id', actorId)
    .maybeSingle()

  if (error) throw error
  if (!data) return false

  return Boolean(data.eh_responsavel_ubt) || String(data.nivel_acesso) === 'administrador'
}

export async function assertActorCanManage(actorId: string): Promise<void> {
  const canManage = await resolveActorCanManage(actorId)
  if (!canManage) {
    throw new CredenciaisError(
      'Somente o responsável pela UBT pode gerenciar credenciais.',
      'FORBIDDEN',
      403,
    )
  }
}
