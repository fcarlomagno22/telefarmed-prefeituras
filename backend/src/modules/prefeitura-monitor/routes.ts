import type { FastifyInstance } from 'fastify'
import {
  requirePrefeituraAuth,
  requirePrefeituraPagePermission,
} from '../prefeitura-auth/middleware.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import { mapPrefeituraMonitorError } from './errors.js'
import {
  getPrefeituraMonitorOverview,
  getPrefeituraMonitorRanking,
} from './overview.service.js'
import {
  monitorOverviewQuerySchema,
  monitorRankingQuerySchema,
  monitorStreamQuerySchema,
} from './schemas.js'
import { formatSseEvent, runPrefeituraMonitorStream } from './stream.service.js'

const canView = requirePrefeituraPagePermission('monitor', 'visualizar')

function entidadeId(request: { prefeituraUser?: { entidadeContratanteId: string } }) {
  return request.prefeituraUser!.entidadeContratanteId
}

export async function registerPrefeituraMonitorRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requirePrefeituraAuth)

  app.get('/overview', { preHandler: canView }, async (request, reply) => {
    const parsed = monitorOverviewQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const units = await listRedeUnits(entidadeId(request))
      const overview = await getPrefeituraMonitorOverview(entidadeId(request), units, parsed.data)
      reply.header('Cache-Control', 'private, max-age=10')
      return reply.send(overview)
    } catch (error) {
      const mapped = mapPrefeituraMonitorError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/ranking', { preHandler: canView }, async (request, reply) => {
    const parsed = monitorRankingQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const units = await listRedeUnits(entidadeId(request))
      const rows = await getPrefeituraMonitorRanking(entidadeId(request), units, parsed.data)
      reply.header('Cache-Control', 'private, max-age=10')
      return reply.send({ rows })
    } catch (error) {
      const mapped = mapPrefeituraMonitorError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/stream', { preHandler: canView }, async (request, reply) => {
    const parsed = monitorStreamQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    reply.hijack()
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })

    const abortController = new AbortController()
    const closeStream = () => {
      if (!abortController.signal.aborted) abortController.abort()
      if (!reply.raw.writableEnded) {
        reply.raw.end()
      }
    }

    request.raw.on('close', closeStream)

    try {
      await runPrefeituraMonitorStream({
        entidadeId: entidadeId(request),
        regionKey: parsed.data.regionKey,
        write: (chunk) => {
          if (!reply.raw.writableEnded) {
            reply.raw.write(chunk)
          }
        },
        signal: abortController.signal,
      })
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        request.log.error({ err: error }, 'prefeitura monitor stream failed')
      }
      if (!reply.raw.writableEnded) {
        reply.raw.write(formatSseEvent({ type: 'error' }))
      }
    } finally {
      closeStream()
    }
  })
}
