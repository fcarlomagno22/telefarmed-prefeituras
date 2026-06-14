import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  requirePrefeituraAuth,
  requirePrefeituraPagePermission,
} from '../prefeitura-auth/middleware.js'
import { registerPortalSuporteRoutes } from '../suporte/portal-routes.js'
import type { PortalActor } from '../suporte/types.js'

const canView = requirePrefeituraPagePermission('suporte', 'visualizar')
const canInsert = requirePrefeituraPagePermission('suporte', 'inserir')
const canEdit = requirePrefeituraPagePermission('suporte', 'editar')
const canDelete = requirePrefeituraPagePermission('suporte', 'excluir')

function actorFromRequest(request: FastifyRequest): PortalActor {
  const user = request.prefeituraUser!
  return {
    variant: 'prefeitura',
    userId: user.id,
    nome: user.nome,
    funcao: user.accessLevel === 'administrador' ? 'Gestor municipal' : 'Operador municipal',
    entidadeId: user.entidadeContratanteId,
  }
}

export async function registerPrefeituraSuporteRoutes(app: FastifyInstance): Promise<void> {
  await registerPortalSuporteRoutes(app, {
    variant: 'prefeitura',
    requireAuth: requirePrefeituraAuth,
    canView,
    canInsert,
    canEdit,
    canDelete,
    actorFromRequest,
  })
}
