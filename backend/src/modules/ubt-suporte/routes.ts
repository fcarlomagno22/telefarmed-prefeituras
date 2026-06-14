import type { FastifyInstance, FastifyRequest } from 'fastify'
import { requireUbtAuth, requireUbtPagePermission } from '../ubt-auth/middleware.js'
import { registerPortalSuporteRoutes } from '../suporte/portal-routes.js'
import type { PortalActor } from '../suporte/types.js'

const canView = requireUbtPagePermission('suporte', 'visualizar')
const canInsert = requireUbtPagePermission('suporte', 'inserir')
const canEdit = requireUbtPagePermission('suporte', 'editar')
const canDelete = requireUbtPagePermission('suporte', 'excluir')

function actorFromRequest(request: FastifyRequest): PortalActor {
  const user = request.ubtUser!
  return {
    variant: 'ubt',
    userId: user.id,
    nome: user.nome,
    funcao: user.accessLevel === 'administrador' ? 'Administrador UBT' : 'Operador UBT',
    entidadeId: user.entidadeContratanteId,
    unitId: user.unidadeUbtId,
  }
}

export async function registerUbtSuporteRoutes(app: FastifyInstance): Promise<void> {
  await registerPortalSuporteRoutes(app, {
    variant: 'ubt',
    requireAuth: requireUbtAuth,
    canView,
    canInsert,
    canEdit,
    canDelete,
    actorFromRequest,
  })
}
