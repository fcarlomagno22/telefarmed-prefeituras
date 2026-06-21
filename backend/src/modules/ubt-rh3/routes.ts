import type { FastifyInstance } from 'fastify'
import {
  requireAnyUbtPagePermission,
  requireUbtAuth,
} from '../ubt-auth/middleware.js'
import type { UbtScope } from '../ubt-pacientes/types.js'
import { listRh3MtSpecialtiesForUbt, listRh3MtSpecialtiesForSchedule, getRh3ScheduleAvailabilityForUbt } from './catalog.service.js'
import { mapUbtRh3Error } from './errors.js'
import {
  rh3AvailabilityParamsSchema,
  rh3AvailabilityQuerySchema,
  rh3ElegibilidadParamsSchema,
  rh3ImmediateConsultationBodySchema,
  rh3ScheduleAppointmentBodySchema,
} from './schemas.js'
import { createRh3ImmediateConsultationForUbt } from './immediate.service.js'
import { encerrarRh3MtConsultaForUbt } from './elegibilidad.service.js'
import { scheduleRh3AppointmentForUbt } from './schedule.service.js'
import { isoDateSchema } from '../ubt-triagem/schemas.js'
import { z } from 'zod'
import {
  setDaySpecialtiesCacheHeaders,
  setScheduleSpecialtiesCacheHeaders,
} from '../../lib/cache/httpCacheHeaders.js'

const canView = requireAnyUbtPagePermission(['triagem', 'agenda'], 'visualizar')
const canInsert = requireAnyUbtPagePermission(['triagem', 'agenda'], 'inserir')

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

export async function registerUbtRh3Routes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUbtAuth)

  app.get('/especialidades', { preHandler: canView }, async (request, reply) => {
    const parsed = z
      .object({
        date: isoDateSchema.optional(),
        scope: z.enum(['schedule', 'day']).optional(),
      })
      .safeParse(request.query)

    try {
      if (parsed.success && parsed.data.scope === 'schedule') {
        const specialties = await listRh3MtSpecialtiesForSchedule(scope(request))
        setScheduleSpecialtiesCacheHeaders(reply)
        return reply.send({ specialties })
      }

      const date =
        parsed.success && parsed.data.date
          ? parsed.data.date
          : new Intl.DateTimeFormat('en-CA', {
              timeZone: 'America/Sao_Paulo',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }).format(new Date())

      const specialties = await listRh3MtSpecialtiesForUbt(scope(request), date)
      setDaySpecialtiesCacheHeaders(reply)
      return reply.send({ date, specialties })
    } catch (error) {
      const mapped = mapUbtRh3Error(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get(
    '/schedule/availability/:rh3EspecialidadId',
    { preHandler: canView },
    async (request, reply) => {
      const params = rh3AvailabilityParamsSchema.safeParse(request.params)
      if (!params.success) {
        return reply.status(400).send({ error: 'Especialidade RH3 inválida.' })
      }

      const query = rh3AvailabilityQuerySchema.safeParse(request.query)
      if (!query.success) {
        return reply.status(400).send({ error: 'Parâmetros de disponibilidade inválidos.' })
      }

      try {
        const payload = await getRh3ScheduleAvailabilityForUbt(
          params.data.rh3EspecialidadId,
          query.data,
        )
        reply.header('Cache-Control', 'private, max-age=15')
        return reply.send(payload)
      } catch (error) {
        const mapped = mapUbtRh3Error(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post('/schedule/appointments', { preHandler: canInsert }, async (request, reply) => {
    const parsed = rh3ScheduleAppointmentBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados de agendamento inválidos.' })
    }

    try {
      const result = await scheduleRh3AppointmentForUbt(scope(request), parsed.data)
      return reply.status(201).send({ appointment: result })
    } catch (error) {
      const mapped = mapUbtRh3Error(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/immediate/consultations', { preHandler: canInsert }, async (request, reply) => {
    const parsed = rh3ImmediateConsultationBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados de teleconsulta imediata inválidos.' })
    }

    try {
      const result = await createRh3ImmediateConsultationForUbt(scope(request), parsed.data)
      return reply.status(201).send({ consultation: result })
    } catch (error) {
      const mapped = mapUbtRh3Error(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/elegibilidad/:cpf', { preHandler: canInsert }, async (request, reply) => {
    const parsed = rh3ElegibilidadParamsSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'CPF inválido.' })
    }

    try {
      await encerrarRh3MtConsultaForUbt(scope(request), parsed.data.cpf)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapUbtRh3Error(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
