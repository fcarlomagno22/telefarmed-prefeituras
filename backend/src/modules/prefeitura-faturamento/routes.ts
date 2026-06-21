import type { FastifyInstance } from 'fastify'
import {
  requirePrefeituraAuth,
  requirePrefeituraPagePermission,
} from '../prefeitura-auth/middleware.js'
import { mapPrefeituraFaturamentoError } from './errors.js'
import {
  excludeLoteItemPrefeituraFaturamento,
  exportBpaPrefeituraFaturamento,
  exportRelatorioPrefeituraFaturamento,
  fecharPrefeituraFaturamento,
  getPrefeituraFaturamentoOverview,
  iniciarComplementoPrefeituraFaturamento,
  listCompetenciasDisponiveis,
  listPrefeituraFaturamentoHistorico,
  listSigtapOcupacoes,
  listSigtapProcedimentos,
  marcarExportadoPrefeituraFaturamento,
  revalidarFechamentoPrefeituraFaturamento,
  restoreLoteItemPrefeituraFaturamento,
} from './fechamento.service.js'
import {
  corrigirPrefeituraFaturamentoPendencia,
  ignorarPrefeituraFaturamentoPendencia,
  listPrefeituraFaturamentoPendencias,
  reavaliarPrefeituraFaturamentoPendencia,
  revalidarCompetenciaPrefeituraFaturamento,
  saveCnsPrefeituraFaturamentoPendencia,
  solicitarCorrecaoClinicaPrefeituraFaturamentoPendencia,
} from './pendencias.service.js'
import {
  competenciaParamSchema,
  complementoBodySchema,
  corrigirBodySchema,
  excludeLoteBodySchema,
  fechamentoRecordParamSchema,
  fechamentosQuerySchema,
  historicoQuerySchema,
  ignoreBodySchema,
  loteItemParamSchema,
  pendenciaIdParamSchema,
  pendenciasQuerySchema,
  sigtapSearchSchema,
} from './schemas.js'

const canView = requirePrefeituraPagePermission('faturamento', 'visualizar')
const canEdit = requirePrefeituraPagePermission('faturamento', 'editar')

function entidadeId(request: { prefeituraUser?: { entidadeContratanteId: string } }) {
  return request.prefeituraUser!.entidadeContratanteId
}

function operadorNome(request: { prefeituraUser?: { nome: string } }) {
  return request.prefeituraUser!.nome
}

export async function registerPrefeituraFaturamentoRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requirePrefeituraAuth)

  app.get('/competencias', { preHandler: canView }, async (request, reply) => {
    try {
      const competencias = await listCompetenciasDisponiveis(entidadeId(request))
      return reply.send({ competencias })
    } catch (error) {
      const mapped = mapPrefeituraFaturamentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/pendencias', { preHandler: canView }, async (request, reply) => {
    const parsed = pendenciasQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const data = await listPrefeituraFaturamentoPendencias(entidadeId(request), parsed.data)
      reply.header('Cache-Control', 'private, max-age=5')
      return reply.send(data)
    } catch (error) {
      const mapped = mapPrefeituraFaturamentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/pendencias/:id/reavaliar', { preHandler: canEdit }, async (request, reply) => {
    const params = pendenciaIdParamSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'Parâmetros inválidos.' })

    try {
      const result = await reavaliarPrefeituraFaturamentoPendencia(
        entidadeId(request),
        params.data.id,
      )
      return reply.send(result)
    } catch (error) {
      const mapped = mapPrefeituraFaturamentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/pendencias/:id/ignorar', { preHandler: canEdit }, async (request, reply) => {
    const params = pendenciaIdParamSchema.safeParse(request.params)
    const body = ignoreBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const result = await ignorarPrefeituraFaturamentoPendencia(
        entidadeId(request),
        params.data.id,
        body.data.justification,
        operadorNome(request),
      )
      return reply.send(result)
    } catch (error) {
      const mapped = mapPrefeituraFaturamentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/pendencias/:id/corrigir', { preHandler: canEdit }, async (request, reply) => {
    const params = pendenciaIdParamSchema.safeParse(request.params)
    const body = corrigirBodySchema.safeParse(request.body)
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const result = await corrigirPrefeituraFaturamentoPendencia(
        entidadeId(request),
        params.data.id,
        body.data,
        operadorNome(request),
      )
      return reply.send(result)
    } catch (error) {
      const mapped = mapPrefeituraFaturamentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/pendencias/:id/cns', { preHandler: canEdit }, async (request, reply) => {
    const params = pendenciaIdParamSchema.safeParse(request.params)
    const body = corrigirBodySchema.pick({ patientCns: true }).safeParse(request.body)
    if (!params.success || !body.success || !body.data.patientCns) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const result = await saveCnsPrefeituraFaturamentoPendencia(
        entidadeId(request),
        params.data.id,
        body.data.patientCns,
        operadorNome(request),
      )
      return reply.send(result)
    } catch (error) {
      const mapped = mapPrefeituraFaturamentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/pendencias/:id/solicitar-correcao-clinica',
    { preHandler: canEdit },
    async (request, reply) => {
      const params = pendenciaIdParamSchema.safeParse(request.params)
      if (!params.success) return reply.status(400).send({ error: 'Parâmetros inválidos.' })

      try {
        const result = await solicitarCorrecaoClinicaPrefeituraFaturamentoPendencia(
          entidadeId(request),
          params.data.id,
          operadorNome(request),
        )
        return reply.send(result)
      } catch (error) {
        const mapped = mapPrefeituraFaturamentoError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post(
    '/competencias/:competencia/revalidar',
    { preHandler: canEdit },
    async (request, reply) => {
      const params = competenciaParamSchema.safeParse(request.params)
      if (!params.success) return reply.status(400).send({ error: 'Parâmetros inválidos.' })

      try {
        const result = await revalidarCompetenciaPrefeituraFaturamento(
          entidadeId(request),
          params.data.competencia,
        )
        return reply.send(result)
      } catch (error) {
        const mapped = mapPrefeituraFaturamentoError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.get('/fechamentos', { preHandler: canView }, async (request, reply) => {
    const parsed = fechamentosQuerySchema.safeParse(request.query)
    if (!parsed.success) return reply.status(400).send({ error: 'Parâmetros inválidos.' })

    try {
      const competencia =
        parsed.data.competencia ??
        (await listCompetenciasDisponiveis(entidadeId(request)))[0] ??
        new Date().toISOString().slice(0, 7)

      const overview = await getPrefeituraFaturamentoOverview(entidadeId(request), competencia)
      reply.header('Cache-Control', 'private, max-age=5')
      return reply.send({ competencia, ...overview })
    } catch (error) {
      const mapped = mapPrefeituraFaturamentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/fechamentos/complemento', { preHandler: canEdit }, async (request, reply) => {
    const body = complementoBodySchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: 'Parâmetros inválidos.' })

    try {
      const record = await iniciarComplementoPrefeituraFaturamento(
        entidadeId(request),
        body.data.competencia,
      )
      const overview = await getPrefeituraFaturamentoOverview(
        entidadeId(request),
        body.data.competencia,
      )
      return reply.send({ record, ...overview })
    } catch (error) {
      const mapped = mapPrefeituraFaturamentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/fechamentos/:recordId/revalidar',
    { preHandler: canEdit },
    async (request, reply) => {
      const params = fechamentoRecordParamSchema.safeParse(request.params)
      if (!params.success) return reply.status(400).send({ error: 'Parâmetros inválidos.' })

      try {
        const overview = await revalidarFechamentoPrefeituraFaturamento(
          entidadeId(request),
          params.data.recordId,
        )
        return reply.send(overview)
      } catch (error) {
        const mapped = mapPrefeituraFaturamentoError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post('/fechamentos/:recordId/fechar', { preHandler: canEdit }, async (request, reply) => {
    const params = fechamentoRecordParamSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'Parâmetros inválidos.' })

    try {
      const result = await fecharPrefeituraFaturamento(
        entidadeId(request),
        params.data.recordId,
        operadorNome(request),
      )
      return reply.send(result)
    } catch (error) {
      const mapped = mapPrefeituraFaturamentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/fechamentos/:recordId/marcar-exportado',
    { preHandler: canEdit },
    async (request, reply) => {
      const params = fechamentoRecordParamSchema.safeParse(request.params)
      if (!params.success) return reply.status(400).send({ error: 'Parâmetros inválidos.' })

      try {
        const overview = await marcarExportadoPrefeituraFaturamento(
          entidadeId(request),
          params.data.recordId,
        )
        return reply.send(overview)
      } catch (error) {
        const mapped = mapPrefeituraFaturamentoError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post(
    '/fechamentos/:recordId/lote/:itemId/excluir',
    { preHandler: canEdit },
    async (request, reply) => {
      const recordParams = fechamentoRecordParamSchema.safeParse(request.params)
      const itemParams = loteItemParamSchema.safeParse(request.params)
      const body = excludeLoteBodySchema.safeParse(request.body)
      if (!recordParams.success || !itemParams.success || !body.success) {
        return reply.status(400).send({ error: 'Parâmetros inválidos.' })
      }

      try {
        const overview = await excludeLoteItemPrefeituraFaturamento(
          entidadeId(request),
          itemParams.data.itemId,
          recordParams.data.recordId,
          body.data.reason,
        )
        return reply.send(overview)
      } catch (error) {
        const mapped = mapPrefeituraFaturamentoError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post(
    '/fechamentos/:recordId/lote/:itemId/restaurar',
    { preHandler: canEdit },
    async (request, reply) => {
      const recordParams = fechamentoRecordParamSchema.safeParse(request.params)
      const itemParams = loteItemParamSchema.safeParse(request.params)
      if (!recordParams.success || !itemParams.success) {
        return reply.status(400).send({ error: 'Parâmetros inválidos.' })
      }

      try {
        const overview = await restoreLoteItemPrefeituraFaturamento(
          entidadeId(request),
          itemParams.data.itemId,
          recordParams.data.recordId,
        )
        return reply.send(overview)
      } catch (error) {
        const mapped = mapPrefeituraFaturamentoError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.get('/fechamentos/:recordId/bpa', { preHandler: canView }, async (request, reply) => {
    const params = fechamentoRecordParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Parâmetros inválidos.' })
    }

    try {
      const file = await exportBpaPrefeituraFaturamento(
        entidadeId(request),
        params.data.recordId,
      )
      reply.header('Content-Type', file.contentType)
      reply.header('Content-Disposition', `attachment; filename="${file.filename}"`)
      return reply.send(file.body)
    } catch (error) {
      const mapped = mapPrefeituraFaturamentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/fechamentos/:recordId/relatorio', { preHandler: canView }, async (request, reply) => {
    const params = fechamentoRecordParamSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'Parâmetros inválidos.' })

    try {
      const file = await exportRelatorioPrefeituraFaturamento(
        entidadeId(request),
        params.data.recordId,
      )
      reply.header('Content-Type', file.contentType)
      reply.header('Content-Disposition', `attachment; filename="${file.filename}"`)
      return reply.send(file.body)
    } catch (error) {
      const mapped = mapPrefeituraFaturamentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/historico', { preHandler: canView }, async (request, reply) => {
    const parsed = historicoQuerySchema.safeParse(request.query)
    if (!parsed.success) return reply.status(400).send({ error: 'Parâmetros inválidos.' })

    try {
      const items = await listPrefeituraFaturamentoHistorico(
        entidadeId(request),
        parsed.data.search,
      )
      return reply.send({ items })
    } catch (error) {
      const mapped = mapPrefeituraFaturamentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/sigtap/ocupacoes', { preHandler: canView }, async (request, reply) => {
    const parsed = sigtapSearchSchema.safeParse(request.query)
    if (!parsed.success) return reply.status(400).send({ error: 'Parâmetros inválidos.' })

    try {
      const options = await listSigtapOcupacoes(parsed.data.q, parsed.data.limit)
      return reply.send({ options })
    } catch (error) {
      const mapped = mapPrefeituraFaturamentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/sigtap/procedimentos', { preHandler: canView }, async (request, reply) => {
    const parsed = sigtapSearchSchema.safeParse(request.query)
    if (!parsed.success) return reply.status(400).send({ error: 'Parâmetros inválidos.' })

    try {
      const options = await listSigtapProcedimentos(
        parsed.data.q,
        parsed.data.cbo,
        parsed.data.limit,
      )
      return reply.send({ options })
    } catch (error) {
      const mapped = mapPrefeituraFaturamentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
