import type { FastifyInstance, FastifyRequest, preHandlerHookHandler } from 'fastify'
import { getEntidadeBrandingById, getEntidadeLogoSignedUrlForPortal } from './branding.service.js'

type PortalAuthUser = {
  entidadeContratanteId: string
}

export async function registerEntidadeBrandingPortalRoutes(
  app: FastifyInstance,
  options: {
    preHandler: preHandlerHookHandler
    getAuthUser: (request: FastifyRequest) => PortalAuthUser | undefined
  },
): Promise<void> {
  app.get('/entidade/logo', { preHandler: options.preHandler }, async (request, reply) => {
    const user = options.getAuthUser(request)
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    try {
      const result = await getEntidadeLogoSignedUrlForPortal(user.entidadeContratanteId)
      return reply.send(result)
    } catch (error) {
      request.log.error({ err: error }, 'entidade logo signed url')
      return reply.status(500).send({ error: 'Não foi possível obter o logo da entidade.' })
    }
  })

  app.get('/entidade/branding', { preHandler: options.preHandler }, async (request, reply) => {
    const user = options.getAuthUser(request)
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    try {
      const branding = await getEntidadeBrandingById(user.entidadeContratanteId)
      if (!branding) {
        return reply.status(404).send({ error: 'Entidade não encontrada.' })
      }
      return reply.send({ branding })
    } catch (error) {
      request.log.error({ err: error }, 'entidade branding')
      return reply.status(500).send({ error: 'Não foi possível obter o branding da entidade.' })
    }
  })
}
