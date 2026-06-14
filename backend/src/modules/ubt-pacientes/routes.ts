import type { FastifyInstance } from 'fastify'
import {
  requireAnyUbtPagePermission,
  requireUbtAuth,
} from '../ubt-auth/middleware.js'
import {
  createUbtPacienteAnotacao,
  createUbtPacienteRegistroContato,
  inactivateUbtPaciente,
  listUbtPacienteAnotacoes,
  listUbtPacienteConsultas,
  listUbtPacienteContatosRegistrados,
} from './activity.service.js'
import {
  formatUbtPacientesValidationError,
  mapUbtPacientesError,
} from './errors.js'
import { uploadUbtPacienteFoto } from './foto.service.js'
import {
  isUbtLgpdUnlocked,
  maskUbtPacienteDto,
  maskUbtPatientRegistrationDetail,
} from './lgpd.js'
import { listUbtPacientes } from './list.service.js'
import { getUbtPacientesFiltros } from './filtros.service.js'
import {
  createUbtPaciente,
  getUbtPacienteRegistrationDetail,
  getUbtPacienteRow,
  getUbtPatientTerritoryPolicy,
  linkUbtPacienteToUnit,
  lookupUbtPatient,
  updateUbtPaciente,
} from './pacientes.service.js'
import {
  createAnotacaoBodySchema,
  createRegistroContatoBodySchema,
  createUbtPacienteBodySchema,
  idParamSchema,
  listUbtPacientesQuerySchema,
  lookupQuerySchema,
  updateUbtPacienteBodySchema,
  uploadPacienteFotoBodySchema,
} from './schemas.js'
import { getUbtPacientesSummary } from './summary.service.js'
import type { UbtScope } from './types.js'

const lookupPages = ['triagem', 'agenda', 'usuarios', 'consultas'] as const
const mutatePages = ['triagem', 'agenda', 'usuarios'] as const
const activityViewPages = ['usuarios', 'consultas'] as const

const canViewUsuarios = requireAnyUbtPagePermission(['usuarios'], 'visualizar')
const canViewPatientActivity = requireAnyUbtPagePermission([...activityViewPages], 'visualizar')
const canLookup = requireAnyUbtPagePermission([...lookupPages], 'visualizar')
const canInsert = requireAnyUbtPagePermission([...mutatePages], 'inserir')
const canEdit = requireAnyUbtPagePermission([...mutatePages, 'consultas'], 'editar')
const canDelete = requireAnyUbtPagePermission(['usuarios'], 'excluir')

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

export async function registerUbtPacientesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireUbtAuth)

  app.get('/summary', { preHandler: canViewUsuarios }, async (request, reply) => {
    try {
      const payload = await getUbtPacientesSummary(scope(request).entidadeContratanteId)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(payload)
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/filtros', { preHandler: canViewUsuarios }, async (request, reply) => {
    try {
      const userScope = scope(request)
      const filtros = await getUbtPacientesFiltros(
        userScope.entidadeContratanteId,
        userScope.unidadeUbtId,
      )
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send(filtros)
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/politica-endereco', { preHandler: canLookup }, async (request, reply) => {
    try {
      const policy = await getUbtPatientTerritoryPolicy(scope(request))
      reply.header('Cache-Control', 'private, max-age=60')
      return reply.send({ policy })
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/lookup', { preHandler: canLookup }, async (request, reply) => {
    const parsed = lookupQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'CPF inv?lido ou ausente.' })
    }

    try {
      const result = await lookupUbtPatient(scope(request), parsed.data)
      return reply.send(result)
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/', { preHandler: canViewUsuarios }, async (request, reply) => {
    const parsed = listUbtPacientesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Par?metros inv?lidos.' })
    }

    try {
      const result = await listUbtPacientes(scope(request).entidadeContratanteId, parsed.data)
      const lgpdUnlocked = await isUbtLgpdUnlocked(request)
      const payload = lgpdUnlocked
        ? result
        : {
            ...result,
            rows: result.rows.map(maskUbtPacienteDto),
          }
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(payload)
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createUbtPacienteBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatUbtPacientesValidationError(parsed.error),
      })
    }

    try {
      const patient = await createUbtPaciente(scope(request), parsed.data)
      return reply.status(201).send({ patient })
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:id/row', { preHandler: canViewPatientActivity }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inv?lido.' })
    }

    try {
      const patient = await getUbtPacienteRow(scope(request), parsed.data.id)
      const lgpdUnlocked = await isUbtLgpdUnlocked(request)
      return reply.send({
        patient: lgpdUnlocked ? patient : maskUbtPacienteDto(patient),
      })
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:id/consultas', { preHandler: canViewPatientActivity }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inv?lido.' })
    }

    try {
      const consultas = await listUbtPacienteConsultas(scope(request), parsed.data.id)
      return reply.send({ consultas })
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:id/anotacoes', { preHandler: canViewPatientActivity }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inv?lido.' })
    }

    try {
      const anotacoes = await listUbtPacienteAnotacoes(scope(request), parsed.data.id)
      return reply.send({ anotacoes })
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:id/anotacoes', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = createAnotacaoBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inv?lidos.' })
    }

    try {
      const anotacao = await createUbtPacienteAnotacao(scope(request), params.data.id, body.data.text)
      return reply.status(201).send({ anotacao })
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:id/contatos-registrados', { preHandler: canViewPatientActivity }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inv?lido.' })
    }

    try {
      const contatos = await listUbtPacienteContatosRegistrados(scope(request), parsed.data.id)
      return reply.send({ contatos })
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:id/contatos-registrados', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = createRegistroContatoBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inv?lidos.' })
    }

    try {
      const contato = await createUbtPacienteRegistroContato(scope(request), params.data.id, body.data)
      return reply.status(201).send({ contato })
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/:id/inativar', { preHandler: canDelete }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inv?lido.' })
    }

    try {
      await inactivateUbtPaciente(scope(request), parsed.data.id)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:id', { preHandler: canLookup }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inv?lido.' })
    }

    try {
      const detail = await getUbtPacienteRegistrationDetail(scope(request), parsed.data.id)
      const lgpdUnlocked = await isUbtLgpdUnlocked(request)
      return reply.send({
        detail: lgpdUnlocked ? detail : maskUbtPatientRegistrationDetail(detail),
      })
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/:id', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'ID inv?lido.' })
    }

    const body = updateUbtPacienteBodySchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({
        error: formatUbtPacientesValidationError(body.error),
      })
    }

    const completeRegistration = body.data.completeRegistration === true
    const { completeRegistration: _ignored, ...patch } = body.data

    try {
      const patient = await updateUbtPaciente(scope(request), params.data.id, patch, {
        completeRegistration,
      })
      return reply.send({ patient })
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:id/vinculo', { preHandler: canInsert }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inv?lido.' })
    }

    try {
      const patient = await linkUbtPacienteToUnit(scope(request), parsed.data.id)
      return reply.send({ patient })
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:id/foto', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'ID inv?lido.' })
    }

    const body = uploadPacienteFotoBodySchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({
        error: formatUbtPacientesValidationError(body.error),
      })
    }

    try {
      const patient = await uploadUbtPacienteFoto(
        scope(request),
        params.data.id,
        body.data.photoDataUrl,
      )
      return reply.send({ patient })
    } catch (error) {
      const mapped = mapUbtPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
