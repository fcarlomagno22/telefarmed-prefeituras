import type { FastifyInstance } from 'fastify'
import {
  requirePrefeituraAuth,
  requirePrefeituraPagePermission,
} from '../prefeitura-auth/middleware.js'
import { getPrefeituraPacientesFiltros } from './filtros.service.js'
import {
  formatPrefeituraPacientesValidationError,
  mapPrefeituraPacientesError,
} from './errors.js'
import {
  createPrefeituraPacienteAnotacao,
  createPrefeituraPacienteRegistroContato,
  listPrefeituraPacienteAnotacoes,
  listPrefeituraPacienteContatosRegistrados,
} from './activity.service.js'
import {
  createPrefeituraPaciente,
  getPrefeituraPacienteDetail,
  listPrefeituraPacientes,
  updatePrefeituraPaciente,
} from './pacientes.service.js'
import {
  createAnotacaoBodySchema,
  createPrefeituraPacienteBodySchema,
  createRegistroContatoBodySchema,
  idParamSchema,
  listPrefeituraPacientesQuerySchema,
  updatePrefeituraPacienteBodySchema,
} from './schemas.js'
import type { PrefeituraPacientesScope } from './types.js'
import { getPrefeituraPacientesSummary } from './summary.service.js'

const canView = requirePrefeituraPagePermission('usuarios', 'visualizar')
const canInsert = requirePrefeituraPagePermission('usuarios', 'inserir')
const canEdit = requirePrefeituraPagePermission('usuarios', 'editar')

function entidadeId(request: { prefeituraUser?: { entidadeContratanteId: string } }) {
  return request.prefeituraUser!.entidadeContratanteId
}

function scope(request: {
  prefeituraUser?: { id: string; nome: string; entidadeContratanteId: string }
}): PrefeituraPacientesScope {
  return {
    operadorId: request.prefeituraUser!.id,
    operadorNome: request.prefeituraUser!.nome,
    entidadeContratanteId: request.prefeituraUser!.entidadeContratanteId,
  }
}

export async function registerPrefeituraPacientesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requirePrefeituraAuth)

  app.get('/summary', { preHandler: canView }, async (request, reply) => {
    try {
      const payload = await getPrefeituraPacientesSummary(entidadeId(request))
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(payload)
    } catch (error) {
      const mapped = mapPrefeituraPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/filtros', { preHandler: canView }, async (request, reply) => {
    try {
      const filtros = await getPrefeituraPacientesFiltros(entidadeId(request))
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send(filtros)
    } catch (error) {
      const mapped = mapPrefeituraPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/', { preHandler: canView }, async (request, reply) => {
    const parsed = listPrefeituraPacientesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const result = await listPrefeituraPacientes(entidadeId(request), parsed.data)
      return reply.send(result)
    } catch (error) {
      const mapped = mapPrefeituraPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:id', { preHandler: canView }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const paciente = await getPrefeituraPacienteDetail(entidadeId(request), parsed.data.id)
      return reply.send({ paciente })
    } catch (error) {
      const mapped = mapPrefeituraPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createPrefeituraPacienteBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatPrefeituraPacientesValidationError(parsed.error),
      })
    }

    try {
      const paciente = await createPrefeituraPaciente(entidadeId(request), parsed.data)
      return reply.status(201).send({ paciente })
    } catch (error) {
      const mapped = mapPrefeituraPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:id/anotacoes', { preHandler: canView }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const anotacoes = await listPrefeituraPacienteAnotacoes(scope(request), parsed.data.id)
      return reply.send({ anotacoes })
    } catch (error) {
      const mapped = mapPrefeituraPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:id/anotacoes', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = createAnotacaoBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const anotacao = await createPrefeituraPacienteAnotacao(
        scope(request),
        params.data.id,
        body.data.text,
      )
      return reply.status(201).send({ anotacao })
    } catch (error) {
      const mapped = mapPrefeituraPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:id/contatos-registrados', { preHandler: canView }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const contatos = await listPrefeituraPacienteContatosRegistrados(scope(request), parsed.data.id)
      return reply.send({ contatos })
    } catch (error) {
      const mapped = mapPrefeituraPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:id/contatos-registrados', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = createRegistroContatoBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const contato = await createPrefeituraPacienteRegistroContato(
        scope(request),
        params.data.id,
        body.data,
      )
      return reply.status(201).send({ contato })
    } catch (error) {
      const mapped = mapPrefeituraPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/:id', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    const body = updatePrefeituraPacienteBodySchema.safeParse(request.body)
    if (!body.success) {
      return reply.status(400).send({
        error: formatPrefeituraPacientesValidationError(body.error),
      })
    }

    try {
      const paciente = await updatePrefeituraPaciente(
        entidadeId(request),
        params.data.id,
        body.data,
      )
      return reply.send({ paciente })
    } catch (error) {
      const mapped = mapPrefeituraPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
