import type { FastifyInstance } from 'fastify'
import {
  requireAnyUbtPagePermission,
  requireUbtAuth,
  requireUbtPagePermission,
} from '../ubt-auth/middleware.js'
import {
  countUbtAgendaSpecialtySlots,
  getUbtAgendaDay,
  getUbtAgendaDoctorOverview,
  getUbtAgendaHistory,
  getUbtAgendaMonthIndicators,
  getUbtAgendaWeek,
  listUbtAgendaDoctorSlots,
  listUbtAgendaMedicos,
  listUbtAgendaSpecialtyAvailability,
} from './catalog.service.js'
import {
  cancelUbtAgendaConsulta,
  confirmUbtAgendaRecepcao,
  createUbtAgendaConsulta,
  createUbtAgendaWalkIn,
  markUbtAgendaFalta,
  updateUbtAgendaConsulta,
} from './consultas.service.js'
import {
  formatUbtAgendaValidationError,
  mapUbtAgendaError,
} from './errors.js'
import { listUbtAgendaDoctorShifts } from './shifts.service.js'
import {
  consultaIdParamsSchema,
  createConsultaBodySchema,
  dateQuerySchema,
  dateRangeQuerySchema,
  doctorOverviewQuerySchema,
  doctorSlotsQuerySchema,
  historyQuerySchema,
  medicosQuerySchema,
  monthIndicatorsQuerySchema,
  specialtyAvailabilityQuerySchema,
  specialtySlotCountParamsSchema,
  specialtySlotCountQuerySchema,
  updateConsultaBodySchema,
  walkInBodySchema,
} from './schemas.js'
import type { UbtScope } from './types.js'

const canView = requireUbtPagePermission('agenda', 'visualizar')
const canInsert = requireAnyUbtPagePermission(['agenda', 'triagem'], 'inserir')
const canEdit = requireUbtPagePermission('agenda', 'editar')
const canDelete = requireUbtPagePermission('agenda', 'excluir')

function scope(request: {
  ubtUser?: {
    id: string
    nome: string
    entidadeContratanteId: string
    unidadeUbtId: string
  }
}): UbtScope {
  return {
    operadorId: request.ubtUser!.id,
    operadorNome: request.ubtUser!.nome,
    entidadeContratanteId: request.ubtUser!.entidadeContratanteId,
    unidadeUbtId: request.ubtUser!.unidadeUbtId,
  }
}

export async function registerUbtAgendaRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUbtAuth)

  app.get('/dia', { preHandler: canView }, async (request, reply) => {
    const parsed = dateQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Data inválida.' })
    }

    try {
      const payload = await getUbtAgendaDay(scope(request), parsed.data.date)
      reply.header('Cache-Control', 'private, max-age=10')
      return reply.send(payload)
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/semana', { preHandler: canView }, async (request, reply) => {
    const parsed = dateRangeQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Período inválido.' })
    }

    try {
      const payload = await getUbtAgendaWeek(scope(request), parsed.data.from, parsed.data.to)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(payload)
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/indicadores-mes', { preHandler: canView }, async (request, reply) => {
    const parsed = monthIndicatorsQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const dates = await getUbtAgendaMonthIndicators(
        scope(request),
        parsed.data.year,
        parsed.data.month,
      )
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send({ dates })
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/historico', { preHandler: canView }, async (request, reply) => {
    const parsed = historyQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const history = await getUbtAgendaHistory(
        scope(request),
        parsed.data.date,
        parsed.data.count,
      )
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send({ history })
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/plantoes', { preHandler: canView }, async (request, reply) => {
    const parsed = dateQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Data inválida.' })
    }

    try {
      const shifts = await listUbtAgendaDoctorShifts(scope(request), parsed.data.date)
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send({ shifts })
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/medicos', { preHandler: canView }, async (request, reply) => {
    const parsed = medicosQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const doctors = await listUbtAgendaMedicos(scope(request), parsed.data)
      reply.header('Cache-Control', 'private, max-age=20')
      return reply.send({ doctors })
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/medicos/:id/slots', { preHandler: canView }, async (request, reply) => {
    const params = zSafeUuidParam(request.params)
    const parsed = doctorSlotsQuerySchema.safeParse(request.query)
    if (!params || !parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const slots = await listUbtAgendaDoctorSlots(
        scope(request),
        params.id,
        parsed.data.date,
      )
      reply.header('Cache-Control', 'private, max-age=10')
      return reply.send({ slots })
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/medicos/:id/overview', { preHandler: canView }, async (request, reply) => {
    const params = zSafeUuidParam(request.params)
    const parsed = doctorOverviewQuerySchema.safeParse(request.query)
    if (!params || !parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const overview = await getUbtAgendaDoctorOverview(
        scope(request),
        params.id,
        parsed.data.from,
        parsed.data.days,
      )
      reply.header('Cache-Control', 'private, max-age=20')
      return reply.send({ overview })
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/especialidades/disponibilidade', { preHandler: canView }, async (request, reply) => {
    const parsed = specialtyAvailabilityQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Data inválida.' })
    }

    try {
      const specialties = await listUbtAgendaSpecialtyAvailability(
        scope(request),
        parsed.data.date,
      )
      reply.header('Cache-Control', 'private, max-age=20')
      return reply.send({ specialties })
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/especialidades/:id/slots-count', { preHandler: canView }, async (request, reply) => {
    const params = specialtySlotCountParamsSchema.safeParse(request.params)
    const parsed = specialtySlotCountQuerySchema.safeParse(request.query)
    if (!params.success || !parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const count = await countUbtAgendaSpecialtySlots(
        scope(request),
        params.data.id,
        parsed.data.date,
      )
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send({ count })
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/consultas', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createConsultaBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatUbtAgendaValidationError(parsed.error),
      })
    }

    try {
      const appointment = await createUbtAgendaConsulta(scope(request), parsed.data)
      return reply.status(201).send({ appointment })
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/encaixe', { preHandler: canInsert }, async (request, reply) => {
    const parsed = walkInBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatUbtAgendaValidationError(parsed.error),
      })
    }

    try {
      const appointment = await createUbtAgendaWalkIn(scope(request), parsed.data)
      return reply.status(201).send({ appointment })
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/consultas/:id', { preHandler: canEdit }, async (request, reply) => {
    const params = consultaIdParamsSchema.safeParse(request.params)
    const body = updateConsultaBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({
        error: body.success
          ? 'ID inválido.'
          : formatUbtAgendaValidationError(body.error),
      })
    }

    try {
      const appointment = await updateUbtAgendaConsulta(
        scope(request),
        params.data.id,
        body.data,
      )
      return reply.send({ appointment })
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/consultas/:id/cancelar', { preHandler: canDelete }, async (request, reply) => {
    const parsed = consultaIdParamsSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      await cancelUbtAgendaConsulta(scope(request), parsed.data.id)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/consultas/:id/recepcao', { preHandler: canEdit }, async (request, reply) => {
    const parsed = consultaIdParamsSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const appointment = await confirmUbtAgendaRecepcao(scope(request), parsed.data.id)
      return reply.send({ appointment })
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/consultas/:id/falta', { preHandler: canEdit }, async (request, reply) => {
    const parsed = consultaIdParamsSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const appointment = await markUbtAgendaFalta(scope(request), parsed.data.id)
      return reply.send({ appointment })
    } catch (error) {
      const mapped = mapUbtAgendaError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}

function zSafeUuidParam(params: unknown): { id: string } | null {
  if (!params || typeof params !== 'object' || !('id' in params)) return null
  const id = String((params as { id: unknown }).id)
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  return { id }
}
