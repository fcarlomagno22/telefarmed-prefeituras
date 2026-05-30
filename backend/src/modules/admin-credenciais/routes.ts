import type { FastifyInstance } from 'fastify'
import { requireAdminAuth, requireAdminPagePermission } from '../admin-auth/middleware.js'
import { mapCredenciaisError } from './errors.js'
import {
  activateInternoCredential,
  createInternoCredential,
  deactivateInternoCredential,
  deleteInternoCredential,
  getInternoCredentialById,
  listInternoCredentials,
  updateInternoCredential,
} from './interno.service.js'
import {
  activatePortalCredential,
  createPortalCredential,
  deactivatePortalCredential,
  deletePortalCredential,
  getPortalCredentialById,
  listPortalCredentials,
  transferPortalCredentialUbt,
  updatePortalCredential,
  verifyPortalResponsiblePin,
} from './portal.service.js'
import {
  getCredenciaisKpis,
  listAllActiveUbtOptions,
  listContractingEntities,
  listUbtOptionsByEntity,
} from './referencias.service.js'
import {
  createInternoBodySchema,
  createPortalBodySchema,
  idParamSchema,
  listInternosQuerySchema,
  listPortalQuerySchema,
  transferPortalUbtBodySchema,
  updateInternoBodySchema,
  updatePortalBodySchema,
  verifyPortalPinBodySchema,
} from './schemas.js'

const canView = requireAdminPagePermission('credenciais', 'visualizar')
const canInsert = requireAdminPagePermission('credenciais', 'inserir')
const canEdit = requireAdminPagePermission('credenciais', 'editar')
const canDelete = requireAdminPagePermission('credenciais', 'excluir')

export async function registerAdminCredenciaisRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdminAuth)

  app.get('/kpis', { preHandler: canView }, async (_request, reply) => {
    try {
      const kpis = await getCredenciaisKpis()
      return reply.send({ kpis })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/entidades-contratantes', { preHandler: canView }, async (_request, reply) => {
    try {
      const entities = await listContractingEntities()
      return reply.send({ entities })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get(
    '/entidades-contratantes/:id/unidades-ubt',
    { preHandler: canView },
    async (request, reply) => {
      const parsed = idParamSchema.safeParse(request.params)
      if (!parsed.success) {
        return reply.status(400).send({ error: 'ID inválido.' })
      }

      try {
        const options = await listUbtOptionsByEntity(parsed.data.id)
        return reply.send({ options })
      } catch (error) {
        const mapped = mapCredenciaisError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.get('/unidades-ubt', { preHandler: canView }, async (_request, reply) => {
    try {
      const options = await listAllActiveUbtOptions()
      return reply.send({ options })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/internos', { preHandler: canView }, async (request, reply) => {
    const parsed = listInternosQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const users = await listInternoCredentials(parsed.data)
      return reply.send({ users })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/internos/:id', { preHandler: canView }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const user = await getInternoCredentialById(parsed.data.id)
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/internos', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createInternoBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const user = await createInternoCredential(parsed.data)
      return reply.status(201).send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/internos/:id', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = updateInternoBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const user = await updateInternoCredential(params.data.id, body.data)
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/internos/:id/desativar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const user = await deactivateInternoCredential(parsed.data.id)
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/internos/:id/reativar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const user = await activateInternoCredential(parsed.data.id)
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/internos/:id', { preHandler: canDelete }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      await deleteInternoCredential(parsed.data.id)
      return reply.send({ ok: true })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/portal', { preHandler: canView }, async (request, reply) => {
    const parsed = listPortalQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const users = await listPortalCredentials(parsed.data)
      return reply.send({ users })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/portal/:id', { preHandler: canView }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const user = await getPortalCredentialById(parsed.data.id)
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/portal', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createPortalBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const user = await createPortalCredential(parsed.data)
      return reply.status(201).send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/portal/:id', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = updatePortalBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const user = await updatePortalCredential(params.data.id, body.data)
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/portal/:id/desativar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const user = await deactivatePortalCredential(parsed.data.id)
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/portal/:id/reativar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const user = await activatePortalCredential(parsed.data.id)
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/portal/:id', { preHandler: canDelete }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      await deletePortalCredential(parsed.data.id)
      return reply.send({ ok: true })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/portal/:id/transferir-ubt', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = transferPortalUbtBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const user = await transferPortalCredentialUbt(params.data.id, body.data.targetUbtId)
      return reply.send({ user })
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/portal/verificar-pin', { preHandler: canView }, async (request, reply) => {
    const parsed = verifyPortalPinBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const result = await verifyPortalResponsiblePin(parsed.data)
      return reply.send(result)
    } catch (error) {
      const mapped = mapCredenciaisError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
