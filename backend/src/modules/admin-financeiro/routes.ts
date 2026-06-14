import type { FastifyInstance } from 'fastify'
import { requireAdminAuth, requireAdminPagePermission } from '../admin-auth/middleware.js'
import { clearBalancoAjuste, getBalanco, upsertBalancoAjuste } from './balanco.service.js'
import { createCentroCusto, listCentrosCusto } from './centros-custo.service.js'
import {
  createContaPagar,
  deleteContaPagar,
  listContasPagar,
  toggleContaPagarPagamento,
  updateContaPagar,
} from './contas-pagar.service.js'
import { formatFinanceiroValidationError, mapFinanceiroError } from './errors.js'
import {
  closeFechamento,
  deleteReceber,
  emitNotaFiscal,
  getNotaFiscalDownloadUrl,
  listFechamentos,
  toggleReceberPagamento,
} from './fechamentos.service.js'
import {
  createFornecedor,
  deleteFornecedor,
  listFornecedores,
  lookupFornecedorCnpj,
  updateFornecedor,
} from './fornecedores.service.js'
import {
  approveRepasseCompetencia,
  listRepasseCompetencias,
  markRepasseCompetenciaPago,
  rejectRepasseCompetencia,
  requestRepasseCorrecao,
  saveRepassePlantaoDecisao,
} from './repasse-profissionais.service.js'
import {
  approveRepasseBodySchema,
  cnpjParamSchema,
  clearBalancoAjusteBodySchema,
  createCentroCustoBodySchema,
  createContaPagarBodySchema,
  createFornecedorBodySchema,
  deleteContaPagarBodySchema,
  deleteFornecedorBodySchema,
  deleteReceberBodySchema,
  idParamSchema,
  listBalancoQuerySchema,
  listFechamentosQuerySchema,
  repasseMotivoBodySchema,
  repassePlantaoDecisaoBodySchema,
  repassePlantaoDecisaoParamsSchema,
  toggleContaPagarBodySchema,
  toggleReceberBodySchema,
  updateContaPagarBodySchema,
  updateFornecedorBodySchema,
  upsertBalancoAjusteBodySchema,
} from './schemas.js'
import { getFinanceiroSummary } from './summary.service.js'

const canView = requireAdminPagePermission('financeiro', 'visualizar')
const canInsert = requireAdminPagePermission('financeiro', 'inserir')
const canEdit = requireAdminPagePermission('financeiro', 'editar')
const canDelete = requireAdminPagePermission('financeiro', 'excluir')

function invalidBody(reply: { status: (c: number) => { send: (b: unknown) => unknown } }, result: {
  success: false
  error: import('zod').ZodError
}) {
  return reply.status(400).send({ error: formatFinanceiroValidationError(result.error) })
}

export async function registerAdminFinanceiroRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdminAuth)

  app.get('/summary', { preHandler: canView }, async (_request, reply) => {
    try {
      return reply.send(await getFinanceiroSummary())
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/fechamentos', { preHandler: canView }, async (request, reply) => {
    const parsed = listFechamentosQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidBody(reply, parsed)

    try {
      const fechamentos = await listFechamentos(parsed.data)
      return reply.send(fechamentos)
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/fechamentos/:id/fechar', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'ID inv?lido.' })

    try {
      const row = await closeFechamento(request.admin!.id, params.data.id)
      return reply.send(row)
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/fechamentos/:id/toggle-pagamento', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = toggleReceberBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inv?lidos.' })
    }

    try {
      const row = await toggleReceberPagamento(
        request.admin!.id,
        params.data.id,
        body.data.pin,
      )
      return reply.send(row)
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/fechamentos/:id', { preHandler: canDelete }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = deleteReceberBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inv?lidos.' })
    }

    try {
      await deleteReceber(request.admin!.id, params.data.id, body.data.pin)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/fechamentos/:id/nota-fiscal/emitir', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'ID inv?lido.' })

    try {
      const nota = await emitNotaFiscal(request.admin!.id, params.data.id)
      return reply.send(nota)
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/fechamentos/:id/nota-fiscal/download', { preHandler: canView }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'ID inv?lido.' })

    try {
      const url = await getNotaFiscalDownloadUrl(params.data.id)
      return reply.send({ url })
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/centros-custo', { preHandler: canView }, async (_request, reply) => {
    try {
      return reply.send(await listCentrosCusto())
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/centros-custo', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createCentroCustoBodySchema.safeParse(request.body)
    if (!parsed.success) return invalidBody(reply, parsed)

    try {
      const centro = await createCentroCusto(parsed.data.nome)
      return reply.status(201).send(centro)
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/fornecedores', { preHandler: canView }, async (_request, reply) => {
    try {
      return reply.send(await listFornecedores())
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/fornecedores', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createFornecedorBodySchema.safeParse(request.body)
    if (!parsed.success) return invalidBody(reply, parsed)

    try {
      const row = await createFornecedor(parsed.data)
      return reply.status(201).send(row)
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.put('/fornecedores/:id', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const parsed = updateFornecedorBodySchema.safeParse({
      ...(request.body as object),
      id: params.success ? params.data.id : undefined,
    })
    if (!params.success || !parsed.success) return invalidBody(reply, parsed as { success: false; error: import('zod').ZodError })

    try {
      const row = await updateFornecedor(parsed.data)
      return reply.send(row)
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/fornecedores/:id', { preHandler: canDelete }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = deleteFornecedorBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inv?lidos.' })
    }

    try {
      await deleteFornecedor(request.admin!.id, params.data.id, body.data.pin)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/cnpj/:cnpj', { preHandler: canInsert }, async (request, reply) => {
    const parsed = cnpjParamSchema.safeParse(request.params)
    if (!parsed.success) return reply.status(400).send({ error: 'CNPJ inv?lido.' })

    try {
      const result = await lookupFornecedorCnpj(parsed.data.cnpj)
      return reply.send(result)
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/contas-pagar', { preHandler: canView }, async (_request, reply) => {
    try {
      return reply.send(await listContasPagar())
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/contas-pagar', { preHandler: canInsert }, async (request, reply) => {
    const parsed = createContaPagarBodySchema.safeParse(request.body)
    if (!parsed.success) return invalidBody(reply, parsed)

    try {
      const row = await createContaPagar(parsed.data)
      return reply.status(201).send(row)
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/contas-pagar/:id', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const parsed = updateContaPagarBodySchema.safeParse(request.body)
    if (!params.success || !parsed.success) return invalidBody(reply, parsed as { success: false; error: import('zod').ZodError })

    try {
      const row = await updateContaPagar(
        request.admin!.id,
        params.data.id,
        parsed.data.pin,
        parsed.data,
      )
      return reply.send(row)
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/contas-pagar/:id/toggle-pagamento', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = toggleContaPagarBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inv?lidos.' })
    }

    try {
      const row = await toggleContaPagarPagamento(
        request.admin!.id,
        params.data.id,
        body.data.pin,
      )
      return reply.send(row)
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/contas-pagar/:id', { preHandler: canDelete }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = deleteContaPagarBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inv?lidos.' })
    }

    try {
      await deleteContaPagar(request.admin!.id, params.data.id, body.data.pin)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/balanco', { preHandler: canView }, async (request, reply) => {
    const parsed = listBalancoQuerySchema.safeParse(request.query)
    if (!parsed.success) return reply.status(400).send({ error: 'Par?metros inv?lidos.' })

    try {
      return reply.send(await getBalanco(parsed.data))
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.put('/balanco/ajustes/:id', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const parsed = upsertBalancoAjusteBodySchema.safeParse(request.body)
    if (!params.success || !parsed.success) return invalidBody(reply, parsed as { success: false; error: import('zod').ZodError })

    try {
      const balanco = await upsertBalancoAjuste(params.data.id, parsed.data.valorConsolidado)
      return reply.send(balanco)
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/balanco/ajustes/:id', { preHandler: canDelete }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const body = clearBalancoAjusteBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Dados inv?lidos.' })
    }

    try {
      const balanco = await clearBalancoAjuste(
        request.admin!.id,
        params.data.id,
        body.data.pin,
      )
      return reply.send(balanco)
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/repasse-profissionais', { preHandler: canView }, async (_request, reply) => {
    try {
      const rows = await listRepasseCompetencias()
      return reply.send({ rows })
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/repasse-profissionais/:id/plantoes/:plantaoId/decisao',
    { preHandler: canEdit },
    async (request, reply) => {
      const params = repassePlantaoDecisaoParamsSchema.safeParse(request.params)
      const parsed = repassePlantaoDecisaoBodySchema.safeParse(request.body)
      if (!params.success || !parsed.success) {
        return invalidBody(reply, parsed as { success: false; error: import('zod').ZodError })
      }

      try {
        const row = await saveRepassePlantaoDecisao(
          request.admin!.id,
          params.data.id,
          params.data.plantaoId,
          parsed.data,
        )
        return reply.send({ row })
      } catch (error) {
        const mapped = mapFinanceiroError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post('/repasse-profissionais/:id/aprovar', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const parsed = approveRepasseBodySchema.safeParse(request.body)
    if (!params.success || !parsed.success) return invalidBody(reply, parsed as { success: false; error: import('zod').ZodError })

    try {
      const row = await approveRepasseCompetencia(
        request.admin!.id,
        params.data.id,
        parsed.data,
      )
      return reply.send({ row })
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/repasse-profissionais/:id/rejeitar', { preHandler: canEdit }, async (request, reply) => {
    const params = idParamSchema.safeParse(request.params)
    const parsed = repasseMotivoBodySchema.safeParse(request.body)
    if (!params.success || !parsed.success) return invalidBody(reply, parsed as { success: false; error: import('zod').ZodError })

    try {
      const row = await rejectRepasseCompetencia(params.data.id, parsed.data.motivo)
      return reply.send({ row })
    } catch (error) {
      const mapped = mapFinanceiroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/repasse-profissionais/:id/solicitar-correcao',
    { preHandler: canEdit },
    async (request, reply) => {
      const params = idParamSchema.safeParse(request.params)
      const parsed = repasseMotivoBodySchema.safeParse(request.body)
      if (!params.success || !parsed.success) return invalidBody(reply, parsed as { success: false; error: import('zod').ZodError })

      try {
        const row = await requestRepasseCorrecao(params.data.id, parsed.data.motivo)
        return reply.send({ row })
      } catch (error) {
        const mapped = mapFinanceiroError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post(
    '/repasse-profissionais/:id/marcar-pago',
    { preHandler: canEdit },
    async (request, reply) => {
      const params = idParamSchema.safeParse(request.params)
      if (!params.success) return reply.status(400).send({ error: 'ID inv?lido.' })

      try {
        const row = await markRepasseCompetenciaPago(request.admin!.id, params.data.id)
        return reply.send({ row })
      } catch (error) {
        const mapped = mapFinanceiroError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )
}
