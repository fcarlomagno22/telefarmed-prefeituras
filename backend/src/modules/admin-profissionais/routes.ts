import type { FastifyInstance } from 'fastify'
import { requireAdminAuth, requireAdminPagePermission } from '../admin-auth/middleware.js'
import {
  aprovarCandidatura,
  getCandidaturaDetail,
  listCandidaturas,
  reprovarCandidatura,
  reviewCandidaturaDocumento,
  solicitarCorrecaoCandidatura,
} from './candidaturas.service.js'
import { getCandidaturasSummary } from './candidaturas-summary.service.js'
import {
  createProfissionalAtivo,
  getProfissionalAtivoDetail,
  inativarProfissionalAtivo,
  listProfissionaisAtivos,
  reativarProfissionalAtivo,
  updateProfissionalAtivo,
} from './ativos.service.js'
import { getAtivosSummary } from './ativos-summary.service.js'
import { formatProfissionaisValidationError, mapProfissionaisError } from './errors.js'
import {
  createAtivoBodySchema,
  documentoParamSchema,
  idParamSchema,
  listAtivosQuerySchema,
  listCandidaturasQuerySchema,
  reprovarCandidaturaBodySchema,
  reviewDocumentoBodySchema,
  solicitarCorrecaoBodySchema,
  updateAtivoBodySchema,
} from './schemas.js'

const canView = requireAdminPagePermission('profissionais', 'visualizar')
const canInsert = requireAdminPagePermission('profissionais', 'inserir')
const canEdit = requireAdminPagePermission('profissionais', 'editar')

function invalidBodyReply(
  reply: { status: (code: number) => { send: (body: { error: string }) => unknown } },
  result: { success: false; error: import('zod').ZodError },
) {
  return reply.status(400).send({ error: formatProfissionaisValidationError(result.error) })
}

export async function registerAdminProfissionaisRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdminAuth)

  app.get('/candidaturas/summary', { preHandler: canView }, async (_request, reply) => {
    try {
      const summary = await getCandidaturasSummary()
      return reply.send(summary)
    } catch (error) {
      const mapped = mapProfissionaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/candidaturas', { preHandler: canView }, async (request, reply) => {
    const parsed = listCandidaturasQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const candidaturas = await listCandidaturas(parsed.data)
      return reply.send({ candidaturas })
    } catch (error) {
      const mapped = mapProfissionaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/candidaturas/:id', { preHandler: canView }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const candidatura = await getCandidaturaDetail(parsed.data.id)
      return reply.send({ candidatura })
    } catch (error) {
      const mapped = mapProfissionaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch(
    '/candidaturas/:id/documentos/:docId',
    { preHandler: canEdit },
    async (request, reply) => {
      const params = documentoParamSchema.safeParse(request.params)
      const body = reviewDocumentoBodySchema.safeParse(request.body)
      if (!params.success || !body.success) {
        if (!body.success) return invalidBodyReply(reply, body)
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const candidatura = await reviewCandidaturaDocumento(
          params.data.id,
          params.data.docId,
          request.admin!.id,
          body.data,
        )
        return reply.send({ candidatura })
      } catch (error) {
        const mapped = mapProfissionaisError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post('/candidaturas/:id/aprovar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const result = await aprovarCandidatura(
        parsed.data.id,
        request.admin!.id,
        request.admin!.nome,
      )
      return reply.send(result)
    } catch (error) {
      const mapped = mapProfissionaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/candidaturas/:id/reprovar', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = reprovarCandidaturaBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      if (!body.success) return invalidBodyReply(reply, body)
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const candidatura = await reprovarCandidatura(
        params.data.id,
        request.admin!.id,
        request.admin!.nome,
        body.data,
      )
      return reply.send({ candidatura })
    } catch (error) {
      const mapped = mapProfissionaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/candidaturas/:id/solicitar-correcao',
    { preHandler: canEdit },
    async (request, reply) => {
      const params = idParamSchema.safeParse(request.params)
      const body = solicitarCorrecaoBodySchema.safeParse(request.body)
      if (!params.success || !body.success) {
        if (!body.success) return invalidBodyReply(reply, body)
        return reply.status(400).send({ error: 'Dados inválidos.' })
      }

      try {
        const candidatura = await solicitarCorrecaoCandidatura(
          params.data.id,
          request.admin!.id,
          request.admin!.nome,
          body.data,
        )
        return reply.send({ candidatura })
      } catch (error) {
        const mapped = mapProfissionaisError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.get('/ativos/summary', { preHandler: canView }, async (_request, reply) => {
    try {
      const summary = await getAtivosSummary()
      return reply.send(summary)
    } catch (error) {
      const mapped = mapProfissionaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/ativos', { preHandler: canView }, async (request, reply) => {
    const parsed = listAtivosQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const profissionais = await listProfissionaisAtivos(parsed.data)
      return reply.send({ profissionais })
    } catch (error) {
      const mapped = mapProfissionaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/ativos/:id', { preHandler: canView }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const profissional = await getProfissionalAtivoDetail(parsed.data.id)
      return reply.send({ profissional })
    } catch (error) {
      const mapped = mapProfissionaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/ativos', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createAtivoBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return invalidBodyReply(reply, parsed)
    }

    try {
      const profissional = await createProfissionalAtivo(parsed.data)
      return reply.status(201).send({ profissional })
    } catch (error) {
      const mapped = mapProfissionaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/ativos/:id', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = updateAtivoBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      if (!body.success) return invalidBodyReply(reply, body)
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const profissional = await updateProfissionalAtivo(params.data.id, body.data)
      return reply.send({ profissional })
    } catch (error) {
      const mapped = mapProfissionaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/ativos/:id/inativar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const profissional = await inativarProfissionalAtivo(parsed.data.id)
      return reply.send({ profissional })
    } catch (error) {
      const mapped = mapProfissionaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/ativos/:id/reativar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const profissional = await reativarProfissionalAtivo(parsed.data.id)
      return reply.send({ profissional })
    } catch (error) {
      const mapped = mapProfissionaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
