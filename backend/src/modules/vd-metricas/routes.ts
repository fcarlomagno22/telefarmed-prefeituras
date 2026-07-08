import type { FastifyInstance } from 'fastify'
import { requireVdAuth } from '../vd-auth/middleware.js'
import { mapVdMetricasError } from './errors.js'
import {
  createMetricasAtividadeLoteBodySchema,
  createMetricasCaminhadaBodySchema,
  createMetricasFrequenciaCardiacaBodySchema,
  createMetricasGlicemiaBodySchema,
  createMetricasHidratacaoBodySchema,
  createMetricasMedidasCorporaisBodySchema,
  createMetricasPesoBodySchema,
  createMetricasPressaoBodySchema,
  formatMetricasValidationError,
  metricasAtividadeQuerySchema,
  metricasFrequenciaCardiacaQuerySchema,
  metricasGlicemiaIdParamsSchema,
  metricasGlicemiaQuerySchema,
  metricasHidratacaoQuerySchema,
  metricasMedidasCorporaisQuerySchema,
  metricasPesoQuerySchema,
  metricasPressaoQuerySchema,
  metricasIntegracaoIdParamsSchema,
  updateMetricasIntegracaoBodySchema,
  updateMetricasPerfilBodySchema,
} from './schemas.js'
import { getVdMetricasPacienteScopeFromRequest } from './scope.js'
import {
  deleteMetricasGlicemia,
  getMetricasAtividadeHistorico,
  getMetricasFrequenciaCardiacaHistorico,
  getMetricasGlicemiaHistorico,
  getMetricasHidratacaoHistorico,
  getMetricasIntegracoes,
  getMetricasMedidasCorporaisHistorico,
  getMetricasPerfil,
  getMetricasPesoHistorico,
  getMetricasPressaoHistorico,
  getMetricasResumo,
  getUltimoMetricasPeso,
  registerMetricasFrequenciaCardiaca,
  registerMetricasCaminhada,
  registerMetricasAtividadeLote,
  registerMetricasGlicemia,
  registerMetricasHidratacao,
  registerMetricasMedidaCorporal,
  registerMetricasPeso,
  registerMetricasPressao,
  updateMetricasIntegracao,
  updateMetricasPerfil,
} from './service.js'

export async function registerVdMetricasRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireVdAuth)

  app.get('/perfil', async (request, reply) => {
    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const profile = await getMetricasPerfil(scope)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send({ profile })
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.put('/perfil', async (request, reply) => {
    const parsed = updateMetricasPerfilBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const profile = await updateMetricasPerfil(scope, parsed.data)
      return reply.send({ profile })
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/peso/ultimo', async (request, reply) => {
    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const latest = await getUltimoMetricasPeso(scope)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(latest)
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/peso', async (request, reply) => {
    const parsed = metricasPesoQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const points = await getMetricasPesoHistorico(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send({ points })
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/peso', async (request, reply) => {
    const parsed = createMetricasPesoBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const result = await registerMetricasPeso(scope, parsed.data)
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/glicemia', async (request, reply) => {
    const parsed = metricasGlicemiaQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const readings = await getMetricasGlicemiaHistorico(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send({ readings })
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/glicemia', async (request, reply) => {
    const parsed = createMetricasGlicemiaBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const result = await registerMetricasGlicemia(scope, parsed.data)
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/glicemia/:id', async (request, reply) => {
    const parsed = metricasGlicemiaIdParamsSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const result = await deleteMetricasGlicemia(scope, parsed.data.id)
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/pressao', async (request, reply) => {
    const parsed = metricasPressaoQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const readings = await getMetricasPressaoHistorico(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send({ readings })
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/pressao', async (request, reply) => {
    const parsed = createMetricasPressaoBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const result = await registerMetricasPressao(scope, parsed.data)
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/hidratacao', async (request, reply) => {
    const parsed = metricasHidratacaoQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const days = await getMetricasHidratacaoHistorico(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send({ days })
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/hidratacao', async (request, reply) => {
    const parsed = createMetricasHidratacaoBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const result = await registerMetricasHidratacao(scope, parsed.data)
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/medidas-corporais', async (request, reply) => {
    const parsed = metricasMedidasCorporaisQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const result = await getMetricasMedidasCorporaisHistorico(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/medidas-corporais', async (request, reply) => {
    const parsed = createMetricasMedidasCorporaisBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const result = await registerMetricasMedidaCorporal(scope, parsed.data)
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/frequencia-cardiaca', async (request, reply) => {
    const parsed = metricasFrequenciaCardiacaQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const readings = await getMetricasFrequenciaCardiacaHistorico(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send({ readings })
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/frequencia-cardiaca', async (request, reply) => {
    const parsed = createMetricasFrequenciaCardiacaBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const result = await registerMetricasFrequenciaCardiaca(scope, parsed.data)
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/atividade', async (request, reply) => {
    const parsed = metricasAtividadeQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const days = await getMetricasAtividadeHistorico(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send({ days })
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/atividade/caminhada', async (request, reply) => {
    const parsed = createMetricasCaminhadaBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const result = await registerMetricasCaminhada(scope, parsed.data)
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/atividade/lote', async (request, reply) => {
    const parsed = createMetricasAtividadeLoteBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const result = await registerMetricasAtividadeLote(scope, parsed.data)
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/integracoes', async (request, reply) => {
    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const result = await getMetricasIntegracoes(scope)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.put('/integracoes/:integrationId', async (request, reply) => {
    const paramsParsed = metricasIntegracaoIdParamsSchema.safeParse(request.params)
    if (!paramsParsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(paramsParsed.error),
        code: 'INVALID_DATA',
      })
    }

    const bodyParsed = updateMetricasIntegracaoBodySchema.safeParse(request.body)
    if (!bodyParsed.success) {
      return reply.status(400).send({
        error: formatMetricasValidationError(bodyParsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const result = await updateMetricasIntegracao(
        scope,
        paramsParsed.data.integrationId,
        bodyParsed.data,
      )
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/resumo', async (request, reply) => {
    try {
      const scope = getVdMetricasPacienteScopeFromRequest(request)
      const summary = await getMetricasResumo(scope)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(summary)
    } catch (error) {
      const mapped = mapVdMetricasError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
