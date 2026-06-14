import type { FastifyInstance } from 'fastify'
import { requireUbtAuth, requireUbtPagePermission } from '../ubt-auth/middleware.js'
import { listUbtCredenciaisAccessLogs } from './access-logs.service.js'
import { mapCredenciaisError } from './errors.js'
import {
  activateOperador,
  createOperador,
  deactivateOperador,
  deleteOperador,
  getOperador,
  listOperadores,
  updateOperador,
} from './operadores.service.js'
import {
  accessLogsQuerySchema,
  createOperadorBodySchema,
  idParamSchema,
  listOperadoresQuerySchema,
  updateOperadorBodySchema,
} from './schemas.js'

const canView = requireUbtPagePermission('credenciais', 'visualizar')
const canInsert = requireUbtPagePermission('credenciais', 'inserir')
const canEdit = requireUbtPagePermission('credenciais', 'editar')
const canDelete = requireUbtPagePermission('credenciais', 'excluir')

function scopeFromRequest(request: {
  ubtUser?: {
    id: string
    entidadeContratanteId: string
    unidadeUbtId: string
  }
}) {
  const user = request.ubtUser!
  return {
    actorId: user.id,
    entidadeContratanteId: user.entidadeContratanteId,
    unidadeUbtId: user.unidadeUbtId,
  }
}

export async function registerUbtCredenciaisRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUbtAuth)

  app.get('/operadores', { preHandler: canView }, async (request, reply) => {
    const parsed = listOperadoresQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const result = await listOperadores(scopeFromRequest(request), parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(result)
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/operadores/:id', { preHandler: canView }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const user = await getOperador(scopeFromRequest(request), parsed.data.id)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/operadores', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createOperadorBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const user = await createOperador(scopeFromRequest(request), parsed.data)
      return reply.status(201).send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/operadores/:id', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = updateOperadorBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const user = await updateOperador(scopeFromRequest(request), params.data.id, body.data)
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/operadores/:id/desativar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const user = await deactivateOperador(scopeFromRequest(request), parsed.data.id)
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/operadores/:id/reativar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const user = await activateOperador(scopeFromRequest(request), parsed.data.id)
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/operadores/:id', { preHandler: canDelete }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      await deleteOperador(scopeFromRequest(request), parsed.data.id)
      return reply.send({ ok: true })
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
      const scope = scopeFromRequest(request)
      const result = await listUbtCredenciaisAccessLogs(scope.unidadeUbtId, parsed.data)
      reply.header('Cache-Control', 'private, max-age=10')
      return reply.send(result)
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
