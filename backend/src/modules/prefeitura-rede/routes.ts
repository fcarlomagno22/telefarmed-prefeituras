import type { FastifyInstance } from 'fastify'
import {
  requirePrefeituraAuth,
  requirePrefeituraPagePermission,
} from '../prefeitura-auth/middleware.js'
import { formatRedeValidationError, mapPrefeituraRedeError } from './errors.js'
import { getRedeMaintenance, updateRedeMaintenance } from './maintenance.service.js'
import { notifyRedeUnit } from './notify.service.js'
import { getRedeOverview } from './overview.service.js'
import {
  createUnitBodySchema,
  maintenanceBodySchema,
  notifyUnitBodySchema,
  settingsBodySchema,
  unitIdParamSchema,
  updateUnitBodySchema,
} from './schemas.js'
import { getRedeSettings, updateRedeSettings } from './settings.service.js'
import {
  createRedeUnit,
  deleteRedeUnit,
  getRedeUnitDetail,
  listRedeUnits,
  updateRedeUnit,
} from './units.service.js'
import { setUnitsCacheHeaders } from '../../lib/cache/httpCacheHeaders.js'

const canView = requirePrefeituraPagePermission('rede', 'visualizar')
const canInsert = requirePrefeituraPagePermission('rede', 'inserir')
const canEdit = requirePrefeituraPagePermission('rede', 'editar')
const canDelete = requirePrefeituraPagePermission('rede', 'excluir')

function entidadeId(request: { prefeituraUser?: { entidadeContratanteId: string } }) {
  return request.prefeituraUser!.entidadeContratanteId
}

export async function registerPrefeituraRedeRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requirePrefeituraAuth)

  app.get('/overview', { preHandler: canView }, async (request, reply) => {
    try {
      const overview = await getRedeOverview(entidadeId(request))
      setUnitsCacheHeaders(reply)
      return reply.send(overview)
    } catch (error) {
      const mapped = mapPrefeituraRedeError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/units', { preHandler: canView }, async (request, reply) => {
    try {
      const units = await listRedeUnits(entidadeId(request))
      setUnitsCacheHeaders(reply)
      return reply.send({ units })
    } catch (error) {
      const mapped = mapPrefeituraRedeError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/units/:unitId', { preHandler: canView }, async (request, reply) => {
    const parsed = unitIdParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID da unidade inválido.' })
    }

    try {
      const detail = await getRedeUnitDetail(entidadeId(request), parsed.data.unitId)
      return reply.send(detail)
    } catch (error) {
      const mapped = mapPrefeituraRedeError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/units', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createUnitBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: formatRedeValidationError(parsed.error) })
    }

    try {
      const detail = await createRedeUnit(entidadeId(request), parsed.data)
      return reply.status(201).send(detail)
    } catch (error) {
      const mapped = mapPrefeituraRedeError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/units/:unitId', { preHandler: canEdit }, async (request, reply) => {
    const params = unitIdParamSchema.safeParse(request.params)
    const body = updateUnitBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const detail = await updateRedeUnit(entidadeId(request), params.data.unitId, body.data)
      return reply.send(detail)
    } catch (error) {
      const mapped = mapPrefeituraRedeError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/units/:unitId', { preHandler: canDelete }, async (request, reply) => {
    const parsed = unitIdParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID da unidade inválido.' })
    }

    try {
      await deleteRedeUnit(entidadeId(request), parsed.data.unitId)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapPrefeituraRedeError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/units/:unitId/notify', { preHandler: canEdit }, async (request, reply) => {
    const params = unitIdParamSchema.safeParse(request.params)
    const body = notifyUnitBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const user = request.prefeituraUser!
      const result = await notifyRedeUnit(
        entidadeId(request),
        params.data.unitId,
        body.data,
        { id: user.id, nome: user.nome },
      )
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapPrefeituraRedeError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/maintenance', { preHandler: canView }, async (request, reply) => {
    try {
      const maintenance = await getRedeMaintenance(entidadeId(request))
      return reply.send(maintenance)
    } catch (error) {
      const mapped = mapPrefeituraRedeError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.put('/maintenance', { preHandler: canEdit }, async (request, reply) => {
    const parsed = maintenanceBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const result = await updateRedeMaintenance(entidadeId(request), parsed.data)
      return reply.send(result)
    } catch (error) {
      const mapped = mapPrefeituraRedeError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/settings', { preHandler: canView }, async (request, reply) => {
    try {
      const settings = await getRedeSettings(entidadeId(request))
      return reply.send(settings)
    } catch (error) {
      const mapped = mapPrefeituraRedeError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.put('/settings', { preHandler: canEdit }, async (request, reply) => {
    const parsed = settingsBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const settings = await updateRedeSettings(entidadeId(request), parsed.data)
      return reply.send(settings)
    } catch (error) {
      const mapped = mapPrefeituraRedeError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
