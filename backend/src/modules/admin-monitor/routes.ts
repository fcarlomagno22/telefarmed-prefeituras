import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import {
  requireAdminAuthWithToken,
  requireAdminPagePermission,
} from '../admin-auth/middleware.js'
import { mapAdminMonitorError } from './errors.js'
import { getAdminMonitorOverview } from './overview.service.js'
import {
  formatSseEvent,
  runAdminMonitorStream,
} from './stream.service.js'
import {
  adminMonitorOverviewQuerySchema,
  adminMonitorStreamQuerySchema,
} from './schemas.js'

const canView = requireAdminPagePermission('monitor', 'visualizar')

async function requireAdminMonitorStreamAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  return requireAdminAuthWithToken(request, reply, { allowQueryToken: true })
}

export async function registerAdminMonitorRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/overview',
    {
      preHandler: [
        async (request, reply) => requireAdminAuthWithToken(request, reply),
        canView,
      ],
    },
    async (request, reply) => {
    const parsed = adminMonitorOverviewQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const overview = await getAdminMonitorOverview(parsed.data)
      reply.header('Cache-Control', 'private, max-age=10')
      return reply.send(overview)
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        request.log.error({ err: error }, 'admin monitor overview failed')
      }
      const mapped = mapAdminMonitorError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  },
  )

  app.get(
    '/stream',
    {
      preHandler: [requireAdminMonitorStreamAuth, canView],
    },
    async (request, reply) => {
      const parsed = adminMonitorStreamQuerySchema.safeParse(request.query)
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
        await runAdminMonitorStream({
          entidadeId: parsed.data.entidadeId,
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
          request.log.error({ err: error }, 'admin monitor stream failed')
        }
        if (!reply.raw.writableEnded) {
          reply.raw.write(
            formatSseEvent({
              type: 'error',
            }),
          )
        }
      } finally {
        closeStream()
      }
    },
  )
}
