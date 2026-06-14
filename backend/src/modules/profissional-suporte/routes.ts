import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  requireProfissionalAuth,
  requireProfissionalPagePermission,
} from '../profissional-auth/middleware.js'
import { registerPortalSuporteRoutes } from '../suporte/portal-routes.js'
import type { PortalActor } from '../suporte/types.js'

const canView = requireProfissionalPagePermission('suporte', 'visualizar')
const canInsert = requireProfissionalPagePermission('suporte', 'inserir')
const canEdit = requireProfissionalPagePermission('suporte', 'editar')
const canDelete = requireProfissionalPagePermission('suporte', 'excluir')

function actorFromRequest(request: FastifyRequest): PortalActor {
  const user = request.profissionalUser!
  return {
    variant: 'profissional',
    userId: user.id,
    nome: user.nome,
    funcao: 'Profissional',
  }
}

export async function registerProfissionalSuporteRoutes(app: FastifyInstance): Promise<void> {
  await registerPortalSuporteRoutes(app, {
    variant: 'profissional',
    requireAuth: requireProfissionalAuth,
    canView,
    canInsert,
    canEdit,
    canDelete,
    actorFromRequest,
  })
}
