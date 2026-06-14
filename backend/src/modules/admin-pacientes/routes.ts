import type { FastifyInstance } from 'fastify'
import { requireAdminAuth, requireAdminAdministrator, requireAdminPagePermission } from '../admin-auth/middleware.js'
import { verifyAdminAuthorizationPin } from '../admin-auth/service.js'
import { formatPacientesValidationError, mapPacientesError } from './errors.js'
import {
  createPaciente,
  exportPacientesCsv,
  findPacienteByCpf,
  getPacienteDetail,
  inactivatePaciente,
  listContractingEntities,
  listPacientes,
  updatePaciente,
} from './pacientes.service.js'
import { getPacienteProntuario } from './prontuario.service.js'
import {
  cancelPreCadastro,
  concludePreCadastro,
  createPreCadastro,
  submitPacientePreCadastro,
} from './pre-cadastro.service.js'
import {
  byCpfQuerySchema,
  createPacienteBodySchema,
  idParamSchema,
  listPacientesQuerySchema,
  preCadastroBodySchemaExport,
  prontuarioBodySchema,
  updatePacienteBodySchema,
} from './schemas.js'
import { getPacientesSummary } from './summary.service.js'

const canView = requireAdminPagePermission('pessoas', 'visualizar')
const canInsert = requireAdminPagePermission('pessoas', 'inserir')
const canEdit = requireAdminPagePermission('pessoas', 'editar')

function invalidBodyReply(
  reply: { status: (code: number) => { send: (body: { error: string }) => unknown } },
  result: { success: false; error: import('zod').ZodError },
) {
  return reply.status(400).send({ error: formatPacientesValidationError(result.error) })
}

export async function registerAdminPacientesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdminAuth)

  app.get('/summary', { preHandler: canView }, async (request, reply) => {
    const parsed = listPacientesQuerySchema
      .pick({ municipio: true, entidadeContratanteId: true })
      .safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const summary = await getPacientesSummary(parsed.data)
      return reply.send(summary)
    } catch (error) {
      const mapped = mapPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/contracting-entities', { preHandler: canView }, async (_request, reply) => {
    try {
      const entidades = await listContractingEntities()
      return reply.send({ entidades })
    } catch (error) {
      const mapped = mapPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/export', { preHandler: canView }, async (request, reply) => {
    const parsed = listPacientesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const csv = await exportPacientesCsv(parsed.data)
      reply.header('Content-Type', 'text/csv; charset=utf-8')
      reply.header('Content-Disposition', 'attachment; filename="pacientes.csv"')
      return reply.send(csv)
    } catch (error) {
      const mapped = mapPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/by-cpf', { preHandler: canView }, async (request, reply) => {
    const parsed = byCpfQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const paciente = await findPacienteByCpf(parsed.data.cpf, parsed.data.entidadeContratanteId)
      return reply.send({ paciente })
    } catch (error) {
      const mapped = mapPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/', { preHandler: canView }, async (request, reply) => {
    const parsed = listPacientesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const pacientes = await listPacientes(parsed.data)
      return reply.send({ pacientes })
    } catch (error) {
      const mapped = mapPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:id/prontuario', { preHandler: [canView, requireAdminAdministrator()] }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = prontuarioBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    const admin = request.admin
    if (!admin) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    try {
      await verifyAdminAuthorizationPin(admin.id, body.data.pin)
      const prontuario = await getPacienteProntuario(params.data.id)
      return reply.send({ prontuario })
    } catch (error) {
      const mapped = mapPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:id', { preHandler: canView }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const paciente = await getPacienteDetail(parsed.data.id)
      return reply.send({ paciente })
    } catch (error) {
      const mapped = mapPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createPacienteBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return invalidBodyReply(reply, parsed)
    }

    try {
      const paciente = await createPaciente(parsed.data)
      return reply.status(201).send({ paciente })
    } catch (error) {
      const mapped = mapPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/:id', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = updatePacienteBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      if (!body.success) return invalidBodyReply(reply, body)
      return reply.status(400).send({ error: 'Dados inválidos.' })
    }

    try {
      const paciente = await updatePaciente(params.data.id, body.data)
      return reply.send({ paciente })
    } catch (error) {
      const mapped = mapPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/:id/inativar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const paciente = await inactivatePaciente(parsed.data.id)
      return reply.send({ paciente })
    } catch (error) {
      const mapped = mapPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/pre-cadastros', { preHandler: canInsert }, async (request, reply) => {
    const parsed = preCadastroBodySchemaExport.safeParse(request.body)
    if (!parsed.success) {
      return invalidBodyReply(reply, parsed)
    }

    try {
      const result = await createPreCadastro(request.admin!.id, parsed.data)
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/pre-cadastros/concluir', { preHandler: canInsert }, async (request, reply) => {
    const parsed = preCadastroBodySchemaExport.safeParse(request.body)
    if (!parsed.success) {
      return invalidBodyReply(reply, parsed)
    }

    try {
      const paciente = await submitPacientePreCadastro(request.admin!.id, parsed.data)
      return reply.status(201).send({ paciente })
    } catch (error) {
      const mapped = mapPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/pre-cadastros/:id/concluir', { preHandler: canInsert }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      const paciente = await concludePreCadastro(parsed.data.id)
      return reply.send({ paciente })
    } catch (error) {
      const mapped = mapPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/pre-cadastros/:id/cancelar', { preHandler: canEdit }, async (request, reply) => {
    const parsed = idParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ID inválido.' })
    }

    try {
      await cancelPreCadastro(parsed.data.id)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapPacientesError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
