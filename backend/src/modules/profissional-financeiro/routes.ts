import multipart from '@fastify/multipart'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  requireProfissionalAuth,
  requireProfissionalPagePermission,
} from '../profissional-auth/middleware.js'
import {
  getProfissionalDadosPagamento,
  updateProfissionalDadosPagamento,
} from './dados-pagamento.service.js'
import {
  formatProfissionalFinanceiroValidationError,
  mapProfissionalFinanceiroError,
  ProfissionalFinanceiroError,
} from './errors.js'
import { submitProfissionalFechamento } from './fechamento.service.js'
import {
  getProfissionalFinanceiroSummary,
  getProfissionalRepasseDetail,
  listProfissionalRepasses,
} from './repasses.service.js'
import {
  competenciaParamSchema,
  listRepassesQuerySchema,
  updateDadosPagamentoBodySchema,
} from './schemas.js'
import type { ProfissionalFinanceiroContext } from './types.js'

const MAX_INVOICE_BYTES = 8 * 1024 * 1024

const canView = requireProfissionalPagePermission('financeiro', 'visualizar')
const canEdit = requireProfissionalPagePermission('financeiro', 'editar')

function profissionalId(request: FastifyRequest): string {
  return request.profissionalUser!.id
}

function loadContext(request: FastifyRequest): ProfissionalFinanceiroContext {
  return { profissionalId: profissionalId(request) }
}

export async function registerProfissionalFinanceiroRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireProfissionalAuth)

  await app.register(multipart, {
    limits: {
      fileSize: MAX_INVOICE_BYTES,
      files: 1,
      fields: 8,
      parts: 10,
    },
  })

  app.get('/summary', { preHandler: canView }, async (request, reply) => {
    try {
      const summary = await getProfissionalFinanceiroSummary(loadContext(request))
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send(summary)
    } catch (error) {
      const mapped = mapProfissionalFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/dados-pagamento', { preHandler: canView }, async (request, reply) => {
    try {
      const dados = await getProfissionalDadosPagamento(loadContext(request))
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(dados)
    } catch (error) {
      const mapped = mapProfissionalFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/dados-pagamento', { preHandler: canEdit }, async (request, reply) => {
    const parsed = updateDadosPagamentoBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatProfissionalFinanceiroValidationError(parsed.error) })
    }

    try {
      const dados = await updateProfissionalDadosPagamento(loadContext(request), parsed.data)
      return reply.send(dados)
    } catch (error) {
      const mapped = mapProfissionalFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/repasses', { preHandler: canView }, async (request, reply) => {
    const parsed = listRepassesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatProfissionalFinanceiroValidationError(parsed.error) })
    }

    try {
      const repasses = await listProfissionalRepasses(loadContext(request), parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send({ repasses })
    } catch (error) {
      const mapped = mapProfissionalFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/repasses/:competencia', { preHandler: canView }, async (request, reply) => {
    const params = competenciaParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Competência inválida.' })
    }

    try {
      const detail = await getProfissionalRepasseDetail(
        loadContext(request),
        params.data.competencia,
      )
      reply.header('Cache-Control', 'private, max-age=10')
      return reply.send(detail)
    } catch (error) {
      const mapped = mapProfissionalFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/repasses/:competencia/fechamento', { preHandler: canEdit }, async (request, reply) => {
    const params = competenciaParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Competência inválida.' })
    }

    try {
      let pixTipo = ''
      let pixChave = ''
      let invoice: { buffer: Buffer; mimeType: string; fileName: string } | null = null

      for await (const part of request.parts()) {
        if (part.type === 'field') {
          if (part.fieldname === 'pixTipo') pixTipo = String(part.value)
          if (part.fieldname === 'pixChave') pixChave = String(part.value)
          continue
        }

        if (part.fieldname === 'invoice') {
          const buffer = await part.toBuffer()
          invoice = {
            buffer,
            mimeType: part.mimetype,
            fileName: part.filename,
          }
        }
      }

      if (!pixTipo.trim() || !pixChave.trim()) {
        throw new ProfissionalFinanceiroError('Informe a chave PIX.', 'INVALID_DATA', 400)
      }

      if (!invoice) {
        throw new ProfissionalFinanceiroError('Anexe a nota fiscal.', 'INVALID_DATA', 400)
      }

      const fechamento = await submitProfissionalFechamento(
        loadContext(request),
        params.data.competencia,
        { pixTipo, pixChave, invoice },
      )

      return reply.status(201).send({ fechamento })
    } catch (error) {
      const mapped = mapProfissionalFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
