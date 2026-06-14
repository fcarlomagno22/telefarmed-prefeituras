import type { FastifyInstance } from 'fastify'
import {
  requirePrefeituraAuth,
  requirePrefeituraPagePermission,
} from '../prefeitura-auth/middleware.js'
import { getPrefeituraAgendaCatalog } from './catalog.service.js'
import { getPrefeituraAgendaDay } from './day.service.js'
import { mapPrefeituraAgendasError } from './errors.js'
import { getPrefeituraAgendaFuture } from './future.service.js'
import { dayQuerySchema, futureQuerySchema, weekQuerySchema } from './schemas.js'
import { getPrefeituraAgendaWeek } from './week.service.js'

const canView = requirePrefeituraPagePermission('agendas', 'visualizar')

function entidadeId(request: { prefeituraUser?: { entidadeContratanteId: string } }) {
  return request.prefeituraUser!.entidadeContratanteId
}

export async function registerPrefeituraAgendasRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requirePrefeituraAuth)

  app.get('/catalog', { preHandler: canView }, async (request, reply) => {
    try {
      const catalog = await getPrefeituraAgendaCatalog(entidadeId(request))
      reply.header('Cache-Control', 'private, max-age=60')
      return reply.send(catalog)
    } catch (error) {
      const mapped = mapPrefeituraAgendasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/semana', { preHandler: canView }, async (request, reply) => {
    const parsed = weekQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const week = await getPrefeituraAgendaWeek(entidadeId(request), parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(week)
    } catch (error) {
      const mapped = mapPrefeituraAgendasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/dia', { preHandler: canView }, async (request, reply) => {
    const parsed = dayQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const day = await getPrefeituraAgendaDay(entidadeId(request), parsed.data)
      reply.header('Cache-Control', 'private, max-age=10')
      return reply.send(day)
    } catch (error) {
      const mapped = mapPrefeituraAgendasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/futuro', { preHandler: canView }, async (request, reply) => {
    const parsed = futureQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const future = await getPrefeituraAgendaFuture(entidadeId(request), parsed.data)
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send(future)
    } catch (error) {
      const mapped = mapPrefeituraAgendasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
