import type { FastifyInstance } from 'fastify'
import { emitDemoClinicalDocument } from './documentos-clinicos.service.js'
import { emitDemoClinicalDocumentBodySchema } from './schemas.js'

const DEMO_RATE_LIMIT = {
  rateLimit: {
    max: 30,
    timeWindow: '1 minute',
  },
} as const

export async function registerPublicDemoRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/documentos-clinicos/emitir',
    { config: DEMO_RATE_LIMIT },
    async (request, reply) => {
      const parsed = emitDemoClinicalDocumentBodySchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.status(400).send({
          error: parsed.error.issues.map((issue) => issue.message).join(' '),
        })
      }

      try {
        const result = await emitDemoClinicalDocument(parsed.data)
        reply.header('Cache-Control', 'private, no-store')
        return reply.send(result)
      } catch (error) {
        request.log.error({ err: error }, 'demo clinical document emit failed')
        return reply.status(500).send({ error: 'Não foi possível gerar o PDF do documento.' })
      }
    },
  )
}
