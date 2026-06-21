import type { FastifyInstance } from 'fastify'
import {
  requirePrefeituraAuth,
  requirePrefeituraPagePermission,
} from '../prefeitura-auth/middleware.js'
import { listPrefeituraCredenciaisAccessLogs } from './access-logs.service.js'
import { mapCredenciaisError } from './errors.js'
import {
  activateGestor,
  createGestor,
  deactivateGestor,
  deleteGestor,
  listGestores,
  updateGestor,
} from './gestores.service.js'
import {
  activateOperador,
  createOperador,
  deactivateOperador,
  deleteOperador,
  listOperadores,
  transferOperadorUbt,
  updateOperador,
  verifyOperadorResponsiblePin,
} from './operadores.service.js'
import {
  getPrefeituraEntitySummary,
  listPrefeituraUbtOptions,
} from './referencias.service.js'
import {
  accessLogsQuerySchema,
  createGestorBodySchema,
  createOperadorBodySchema,
  idParamSchema,
  transferOperadorUbtBodySchema,
  updateGestorBodySchema,
  updateOperadorBodySchema,
  verifyOperadorPinBodySchema,
} from './schemas.js'
import { setUnitsCacheHeaders } from '../../lib/cache/httpCacheHeaders.js'

const canView = requirePrefeituraPagePermission('credenciais', 'visualizar')
const canInsert = requirePrefeituraPagePermission('credenciais', 'inserir')
const canEdit = requirePrefeituraPagePermission('credenciais', 'editar')
const canDelete = requirePrefeituraPagePermission('credenciais', 'excluir')

function entidadeId(request: { prefeituraUser?: { entidadeContratanteId: string } }) {
  return request.prefeituraUser!.entidadeContratanteId
}

function actorId(request: { prefeituraUser?: { id: string } }) {
  return request.prefeituraUser!.id
}

export async function registerPrefeituraCredenciaisRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requirePrefeituraAuth)

  app.get('/entidade', { preHandler: canView }, async (request, reply) => {
    try {
      const entity = await getPrefeituraEntitySummary(entidadeId(request))
      reply.header('Cache-Control', 'private, max-age=300')
      return reply.send(entity)
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/unidades-ubt', { preHandler: canView }, async (request, reply) => {
    try {
      const options = await listPrefeituraUbtOptions(entidadeId(request))
      setUnitsCacheHeaders(reply)
      return reply.send({ options })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/gestores', { preHandler: canView }, async (request, reply) => {
    try {
      const users = await listGestores(entidadeId(request))
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send({ users })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/gestores', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createGestorBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const user = await createGestor(entidadeId(request), parsed.data)
      return reply.status(201).send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/gestores/:id', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = updateGestorBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const user = await updateGestor(
        entidadeId(request),
        actorId(request),
        params.data.id,
        body.data,
      )
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/gestores/:id/desativar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const user = await deactivateGestor(
        entidadeId(request),
        actorId(request),
        parsed.data.id,
      )
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/gestores/:id/reativar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const user = await activateGestor(entidadeId(request), parsed.data.id)
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/gestores/:id', { preHandler: canDelete }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      await deleteGestor(entidadeId(request), actorId(request), parsed.data.id)
      return reply.send({ ok: true })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/operadores-ubt', { preHandler: canView }, async (request, reply) => {
    try {
      const users = await listOperadores(entidadeId(request))
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send({ users })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/operadores-ubt', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createOperadorBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const user = await createOperador(entidadeId(request), parsed.data)
      return reply.status(201).send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/operadores-ubt/:id', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = updateOperadorBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const user = await updateOperador(
        entidadeId(request),
        actorId(request),
        params.data.id,
        body.data,
      )
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/operadores-ubt/:id/desativar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const user = await deactivateOperador(
        entidadeId(request),
        actorId(request),
        parsed.data.id,
      )
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/operadores-ubt/:id/reativar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const user = await activateOperador(entidadeId(request), parsed.data.id)
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/operadores-ubt/:id', { preHandler: canDelete }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      await deleteOperador(entidadeId(request), actorId(request), parsed.data.id)
      return reply.send({ ok: true })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/operadores-ubt/:id/transferir-ubt', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = transferOperadorUbtBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const user = await transferOperadorUbt(
        entidadeId(request),
        params.data.id,
        body.data.targetUbtId,
      )
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/operadores-ubt/verificar-pin-responsavel', { preHandler: canView }, async (request, reply) => {
    const parsed = verifyOperadorPinBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const result = await verifyOperadorResponsiblePin(entidadeId(request), parsed.data)
      return reply.send(result)
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/logs-acesso', { preHandler: canView }, async (request, reply) => {
    const parsed = accessLogsQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const result = await listPrefeituraCredenciaisAccessLogs(
        entidadeId(request),
        parsed.data,
      )
      reply.header('Cache-Control', 'private, max-age=10')
      return reply.send(result)
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
