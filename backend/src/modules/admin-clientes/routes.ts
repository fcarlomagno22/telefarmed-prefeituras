import type { FastifyInstance } from 'fastify'
import { requireAdminAuth, requireAdminPagePermission } from '../admin-auth/middleware.js'
import {
  getClientesClinicoCatalog,
  getClientesContratoCatalog,
} from './catalog.service.js'
import { mapClientesError, formatClientesValidationError } from './errors.js'
import {
  createClienteContrato,
  createClienteEntidade,
  deleteClienteContrato,
  deleteClienteEntidade,
  getClienteEntidade,
  listClientesEntidades,
  updateClienteContrato,
  updateClienteContratoStatus,
  updateClienteEntidade,
  updateClienteEntidadeContacts,
  updateClienteEntidadeStatus,
} from './entidades.service.js'
import {
  contratoIdParamSchema,
  createContratoBodySchema,
  createEntidadeBodySchema,
  deleteWithPinBodySchema,
  entidadeUbtParamsSchema,
  idParamSchema,
  listClinicoQuerySchema,
  listEntidadesQuerySchema,
  updateContratoBodySchema,
  updateContratoStatusBodySchema,
  updateEntidadeBodySchema,
  updateEntidadeContactsBodySchema,
  updateEntidadeStatusBodySchema,
} from './schemas.js'
import { getClientesSummary } from './summary.service.js'
import { listClienteUbts } from './ubts.service.js'
import {
  createUnitBodySchema,
  updateUnitBodySchema,
} from '../prefeitura-rede/schemas.js'
import {
  createRedeUnit,
  deleteRedeUnit,
  updateRedeUnit,
} from '../prefeitura-rede/units.service.js'

const canView = requireAdminPagePermission('clientes', 'visualizar')
const canInsert = requireAdminPagePermission('clientes', 'inserir')
const canEdit = requireAdminPagePermission('clientes', 'editar')
const canDelete = requireAdminPagePermission('clientes', 'excluir')

const CATALOG_CACHE_MAX_AGE_SECONDS = 60

function invalidBodyReply(
  reply: { status: (code: number) => { send: (body: { error: string }) => unknown } },
  result: { success: false; error: import('zod').ZodError },
) {
  return reply.status(400).send({ error: formatClientesValidationError(result.error) })
}

function setCatalogCacheHeaders(reply: { header: (name: string, value: string) => void }) {
  reply.header('Cache-Control', `private, max-age=${CATALOG_CACHE_MAX_AGE_SECONDS}`)
}

export async function registerAdminClientesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdminAuth)

  app.get('/summary', { preHandler: canView }, async (_request, reply) => {
    try {
      const summary = await getClientesSummary()
      return reply.send(summary)
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/entidades', { preHandler: canView }, async (request, reply) => {
    const parsed = listEntidadesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const entidades = await listClientesEntidades(parsed.data)
      return reply.send({ entidades })
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/entidades/:id/ubts', { preHandler: canView }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const result = await listClienteUbts(parsed.data.id)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(result)
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/entidades/:id/ubts', { preHandler: canInsert }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = createUnitBodySchema.safeParse(request.body)
    if (!params.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }
    if (!body.success) {
      return invalidBodyReply(reply, body)
    }

    try {
      await createRedeUnit(params.data.id, body.data)
      const result = await listClienteUbts(params.data.id)
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/entidades/:id/ubts/:ubtId', { preHandler: canEdit }, async (request, reply) => {
    const params = entidadeUbtParamsSchema.safeParse(request.params)
    const body = updateUnitBodySchema.safeParse(request.body)
    if (!params.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }
    if (!body.success) {
      return invalidBodyReply(reply, body)
    }

    try {
      await updateRedeUnit(params.data.id, params.data.ubtId, body.data)
      const result = await listClienteUbts(params.data.id)
      return reply.send(result)
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/entidades/:id/ubts/:ubtId', { preHandler: canDelete }, async (request, reply) => {
    const params = entidadeUbtParamsSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      await deleteRedeUnit(params.data.id, params.data.ubtId)
      const result = await listClienteUbts(params.data.id)
      return reply.send(result)
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/entidades/:id', { preHandler: canView }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const entidade = await getClienteEntidade(parsed.data.id)
      return reply.send({ entidade })
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/entidades', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createEntidadeBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const entidade = await createClienteEntidade(request.admin!.id, parsed.data)
      return reply.status(201).send({ entidade })
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/entidades/:id', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = updateEntidadeBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      if (!body.success) return invalidBodyReply(reply, body)
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const entidade = await updateClienteEntidade(
        request.admin!.id,
        params.data.id,
        body.data,
      )
      return reply.send({ entidade })
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/entidades/:id/status', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = updateEntidadeStatusBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const entidade = await updateClienteEntidadeStatus(
        request.admin!.id,
        params.data.id,
        body.data.pin,
        body.data.status,
      )
      return reply.send({ entidade })
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/entidades/:id/contacts', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = updateEntidadeContactsBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const entidade = await updateClienteEntidadeContacts(
        request.admin!.id,
        params.data.id,
        body.data,
      )
      return reply.send({ entidade })
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/entidades/:id', { preHandler: canDelete }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = deleteWithPinBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      await deleteClienteEntidade(request.admin!.id, params.data.id, body.data.pin)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/entidades/:id/contratos', { preHandler: canInsert }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = createContratoBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      if (!body.success) return invalidBodyReply(reply, body)
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const entidade = await createClienteContrato(
        request.admin!.id,
        params.data.id,
        body.data,
      )
      return reply.status(201).send({ entidade })
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/contratos/:contratoId', { preHandler: canEdit }, async (request, reply) => {
    const params = contratoIdParamSchema.safeParse(request.params)
    const body = updateContratoBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      if (!body.success) return invalidBodyReply(reply, body)
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const entidade = await updateClienteContrato(
        request.admin!.id,
        params.data.contratoId,
        body.data,
      )
      return reply.send({ entidade })
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/contratos/:contratoId/status', { preHandler: canEdit }, async (request, reply) => {
    const params = contratoIdParamSchema.safeParse(request.params)
    const body = updateContratoStatusBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const entidade = await updateClienteContratoStatus(
        request.admin!.id,
        params.data.contratoId,
        body.data.pin,
        body.data.action,
      )
      return reply.send({ entidade })
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/contratos/:contratoId', { preHandler: canDelete }, async (request, reply) => {
    const params = contratoIdParamSchema.safeParse(request.params)
    const body = deleteWithPinBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const entidade = await deleteClienteContrato(
        request.admin!.id,
        params.data.contratoId,
        body.data.pin,
      )
      return reply.send({ entidade })
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/catalog/clinico', { preHandler: canView }, async (request, reply) => {
    const parsed = listClinicoQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const catalog = await getClientesClinicoCatalog({ activeOnly: parsed.data.activeOnly })
      setCatalogCacheHeaders(reply)
      return reply.send(catalog)
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/catalog/contratos', { preHandler: canView }, async (_request, reply) => {
    try {
      const catalog = await getClientesContratoCatalog()
      setCatalogCacheHeaders(reply)
      return reply.send(catalog)
    } catch (error) {
      const mapped = mapClientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
