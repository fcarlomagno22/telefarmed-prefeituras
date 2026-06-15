import type { FastifyInstance } from 'fastify'
import { requireAdminAuth, requireAdminPagePermission } from '../admin-auth/middleware.js'
import { saveEscalaBatch } from './batch.service.js'
import { checkEscalaConflicts } from './conflicts.service.js'
import { listEscalaContratos } from './contratos.service.js'
import { formatEscalaValidationError, mapEscalaError } from './errors.js'
import {
  acceptEscalaInscricao,
  listEscalaInscricoes,
  rejectEscalaInscricao,
} from './inscricoes.service.js'
import { getEscalaCatalog } from './catalog.service.js'
import {
  batchSaveBodySchema,
  cancelPlantaoBodySchema,
  conflictsBodySchema,
  contratosBodySchema,
  deleteShiftsBodySchema,
  idParamSchema,
  listInscricoesQuerySchema,
  listShiftsQuerySchema,
  rejectInscricaoBodySchema,
} from './schemas.js'
import { cancelEscalaPlantao, deleteEscalaShifts, listEscalaShifts } from './shifts.service.js'
import { getEscalaShiftExecution } from './execution.service.js'
import { getEscalaSummary } from './summary.service.js'

const canView = requireAdminPagePermission('gestaoEscala', 'visualizar')
const canInsert = requireAdminPagePermission('gestaoEscala', 'inserir')
const canEdit = requireAdminPagePermission('gestaoEscala', 'editar')
const canDelete = requireAdminPagePermission('gestaoEscala', 'excluir')

function invalidBodyReply(
  reply: { status: (code: number) => { send: (body: { error: string }) => unknown } },
  result: { success: false; error: import('zod').ZodError },
) {
  return reply.status(400).send({ error: formatEscalaValidationError(result.error) })
}

export async function registerAdminEscalaRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdminAuth)

  app.get('/summary', { preHandler: canView }, async (_request, reply) => {
    try {
      return reply.send(await getEscalaSummary())
    } catch (error) {
      const mapped = mapEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/catalog', { preHandler: canView }, async (_request, reply) => {
    try {
      return reply.send(await getEscalaCatalog())
    } catch (error) {
      const mapped = mapEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/contratos', { preHandler: canView }, async (request, reply) => {
    const parsed = contratosBodySchema.safeParse(request.body)
    if (!parsed.success) return invalidBodyReply(reply, parsed)

    try {
      return reply.send(await listEscalaContratos(parsed.data))
    } catch (error) {
      const mapped = mapEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/shifts', { preHandler: canView }, async (request, reply) => {
    const parsed = listShiftsQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const shifts = await listEscalaShifts(parsed.data)
      return reply.send({ shifts })
    } catch (error) {
      const mapped = mapEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/shifts/:id/execution', { preHandler: canView }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const execution = await getEscalaShiftExecution(params.data.id)
      return reply.send(execution)
    } catch (error) {
      const mapped = mapEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/batches', async (request, reply) => {
    const parsed = batchSaveBodySchema.safeParse(request.body)
    if (!parsed.success) return invalidBodyReply(reply, parsed)

    const admin = request.admin
    if (!admin) return reply.status(401).send({ error: 'Não autenticado.' })

    const isEdit = Boolean(parsed.data.replaceBatchId)
    const permissionGuard = isEdit ? canEdit : canInsert
    await permissionGuard(request, reply)
    if (reply.sent) return

    try {
      const result = await saveEscalaBatch(parsed.data, admin.id)
      return reply.send(result)
    } catch (error) {
      const mapped = mapEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/shifts', { preHandler: canDelete }, async (request, reply) => {
    const parsed = deleteShiftsBodySchema.safeParse(request.body)
    if (!parsed.success) return invalidBodyReply(reply, parsed)

    const admin = request.admin
    if (!admin) return reply.status(401).send({ error: 'Não autenticado.' })

    try {
      const result = await deleteEscalaShifts(parsed.data.shiftIds, {
        id: admin.id,
        nome: admin.nome,
      })
      return reply.send({
        message: 'Plantão(ões) excluído(s) com sucesso.',
        notifiedCount: result.notifiedCount,
      })
    } catch (error) {
      const mapped = mapEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/conflicts', { preHandler: canView }, async (request, reply) => {
    const parsed = conflictsBodySchema.safeParse(request.body)
    if (!parsed.success) return invalidBodyReply(reply, parsed)

    try {
      return reply.send(await checkEscalaConflicts(parsed.data))
    } catch (error) {
      const mapped = mapEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/inscricoes', { preHandler: canView }, async (request, reply) => {
    const parsed = listInscricoesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const inscricoes = await listEscalaInscricoes(parsed.data)
      return reply.send({ inscricoes })
    } catch (error) {
      const mapped = mapEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/inscricoes/:id/accept', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    const admin = request.admin
    if (!admin) return reply.status(401).send({ error: 'Não autenticado.' })

    try {
      await acceptEscalaInscricao(params.data.id, admin.id)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/inscricoes/:id/reject', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    const parsed = rejectInscricaoBodySchema.safeParse(request.body)
    if (!parsed.success) return invalidBodyReply(reply, parsed)

    const admin = request.admin
    if (!admin) return reply.status(401).send({ error: 'Não autenticado.' })

    try {
      await rejectEscalaInscricao(params.data.id, parsed.data.motivoRejeicao, admin.id)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/shifts/:id/cancel', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    const parsed = cancelPlantaoBodySchema.safeParse(request.body)
    if (!parsed.success) return invalidBodyReply(reply, parsed)

    const admin = request.admin
    if (!admin) return reply.status(401).send({ error: 'Não autenticado.' })

    try {
      await cancelEscalaPlantao(params.data.id, parsed.data.motivoCancelamento, admin.id)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapEscalaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
