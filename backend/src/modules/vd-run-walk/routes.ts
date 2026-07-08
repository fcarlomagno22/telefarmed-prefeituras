import type { FastifyInstance } from 'fastify'
import type { AuthenticatedVdUser } from '../vd-auth/middleware.js'
import {
  auditRunWalkAtividadeRegistered,
  auditRunWalkLivePointsAppended,
  auditRunWalkLocalCreated,
} from '../../lib/auditoria/vd-run-walk-events.js'
import { requireVdAuth } from '../vd-auth/middleware.js'
import { mapVdRunWalkError } from './errors.js'
import {
  RUN_WALK_APPEND_LIVE_POINTS_RATE_LIMIT,
  RUN_WALK_CREATE_ATIVIDADE_RATE_LIMIT,
  RUN_WALK_CREATE_LOCAL_RATE_LIMIT,
} from './rate-limits.js'
import { getVdRunWalkPacienteScopeFromRequest } from './scope.js'
import {
  getRunWalkMetasSemanais,
  putRunWalkMetasSemanais,
} from './metas-semanais.service.js'
import { getRunWalkMetasSemanaisProgresso } from './progresso-semanal.service.js'
import { getRunWalkDisposicao, postRunWalkDisposicaoCheckin } from './disposicao.service.js'
import { getRunWalkPlanoHoje, postRunWalkPlanoHojeAcao, putRunWalkPlanoHoje } from './plano.service.js'
import {
  appendLiveSessionPointsBodySchema,
  createLiveSessionBodySchema,
  createRunWalkAtividadeBodySchema,
  applyPlanoHojeAcaoBodySchema,
  createContatoConfiancaBodySchema,
  createDisposicaoCheckinBodySchema,
  createRunWalkLocalBodySchema,
  createRunWalkLocalComentarioBodySchema,
  formatRunWalkValidationError,
  listRunWalkLocaisQuerySchema,
  listRunWalkLocalComentariosQuerySchema,
  postRunWalkLocalVotoBodySchema,
  runWalkIntegracoesLeiturasTempoRealQuerySchema,
  runWalkLocalIdParamsSchema,
  upsertPreparacaoRascunhoBodySchema,
  runWalkContatoConfiancaIdParamsSchema,
  updateContatoConfiancaBodySchema,
  listRunWalkAtividadesQuerySchema,
  patchAtividadeCheckinBodySchema,
  resumoRunWalkAtividadesQuerySchema,
  runWalkAtividadeIdParamsSchema,
  runWalkLiveSessionIdParamsSchema,
  upsertMetasSemanaisBodySchema,
  upsertPlanoHojeBodySchema,
} from './schemas.js'
import {
  activateRunWalkContatoConfiancaSos,
  createRunWalkContatoConfianca,
  deleteRunWalkContatoConfianca,
  getRunWalkContatosConfianca,
  updateRunWalkContatoConfianca,
} from './contatos-confianca.service.js'
import {
  createRunWalkLocal,
  createRunWalkLocalCoverUploadUrl,
  listRunWalkLocais,
} from './locais.service.js'
import {
  createRunWalkLocalComentario,
  listRunWalkLocalComentarios,
  postRunWalkLocalVoto,
} from './locais-engajamento.service.js'
import {
  appendRunWalkLiveSessionPoints,
  createRunWalkLiveSession,
  endRunWalkLiveSession,
} from './live-sessions.service.js'
import { getRunWalkIntegracoesLeiturasTempoReal } from './integracoes-leituras-tempo-real.service.js'
import {
  deleteRunWalkPreparacaoRascunho,
  getRunWalkPreparacaoRascunho,
  putRunWalkPreparacaoRascunho,
} from './preparacao-rascunho.service.js'
import {
  deleteRunWalkAtividade,
  getRunWalkAtividadeById,
  getRunWalkAtividadesResumo,
  getVdRunWalkHealth,
  listRunWalkAtividades,
  patchRunWalkAtividadeCheckin,
  registerRunWalkAtividade,
} from './service.js'
import { RUN_WALK_E2E_TEST_VD_USER } from './testing/e2eTestVdUser.js'

export type RegisterVdRunWalkRoutesOptions = {
  /** Apenas testes — injeta `request.vdUser` antes de chamar os handlers. */
  skipAuth?: boolean
  /** Usuário VD usado quando `skipAuth` é verdadeiro. */
  testVdUser?: AuthenticatedVdUser
}

export async function registerVdRunWalkRoutes(
  app: FastifyInstance,
  options: RegisterVdRunWalkRoutesOptions = {},
): Promise<void> {
  if (!options.skipAuth) {
    app.addHook('preHandler', requireVdAuth)
  } else {
    app.addHook('preHandler', async (request) => {
      request.vdUser = options.testVdUser ?? RUN_WALK_E2E_TEST_VD_USER
    })
  }

  app.get('/atividades', async (request, reply) => {
    const parsed = listRunWalkAtividadesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await listRunWalkAtividades(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/atividades/resumo', async (request, reply) => {
    const parsed = resumoRunWalkAtividadesQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const resumo = await getRunWalkAtividadesResumo(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(resumo)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/atividades/:id', async (request, reply) => {
    const parsed = runWalkAtividadeIdParamsSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const activity = await getRunWalkAtividadeById(scope, parsed.data.id)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send({ activity })
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/atividades/:id/checkin', async (request, reply) => {
    const parsedParams = runWalkAtividadeIdParamsSchema.safeParse(request.params)
    if (!parsedParams.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedParams.error),
        code: 'INVALID_DATA',
      })
    }

    const parsedBody = patchAtividadeCheckinBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedBody.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const activity = await patchRunWalkAtividadeCheckin(
        scope,
        parsedParams.data.id,
        parsedBody.data,
      )
      reply.header('Cache-Control', 'private, no-store')
      return reply.send({ activity })
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/atividades/:id', async (request, reply) => {
    const parsed = runWalkAtividadeIdParamsSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      await deleteRunWalkAtividade(scope, parsed.data.id)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/atividades', { config: RUN_WALK_CREATE_ATIVIDADE_RATE_LIMIT }, async (request, reply) => {
    const parsed = createRunWalkAtividadeBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await registerRunWalkAtividade(scope, parsed.data)
      auditRunWalkAtividadeRegistered(request, scope, {
        activityId: result.activity.id,
        clientActivityId: result.activity.clientActivityId,
        modality: result.activity.modality,
        created: result.created,
        distanceKm: result.activity.distanceKm,
        activeMinutes: result.activity.activeMinutes,
      })
      reply.header('Cache-Control', 'private, no-store')
      return reply.status(result.created ? 201 : 200).send({ activity: result.activity })
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/metas-semanais/progresso', async (request, reply) => {
    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const progresso = await getRunWalkMetasSemanaisProgresso(scope)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(progresso)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/metas-semanais', async (request, reply) => {
    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const metas = await getRunWalkMetasSemanais(scope)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(metas)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.put('/metas-semanais', async (request, reply) => {
    const parsed = upsertMetasSemanaisBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const metas = await putRunWalkMetasSemanais(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(metas)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/disposicao', async (request, reply) => {
    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const disposicao = await getRunWalkDisposicao(scope)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(disposicao)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/disposicao/checkin', async (request, reply) => {
    const parsed = createDisposicaoCheckinBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await postRunWalkDisposicaoCheckin(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.status(200).send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/plano/hoje', async (request, reply) => {
    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const plano = await getRunWalkPlanoHoje(scope)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(plano)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.put('/plano/hoje', async (request, reply) => {
    const parsed = upsertPlanoHojeBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const plano = await putRunWalkPlanoHoje(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(plano)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/plano/hoje/acoes', async (request, reply) => {
    const parsed = applyPlanoHojeAcaoBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await postRunWalkPlanoHojeAcao(scope, parsed.data.action)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/preparacao/rascunho', async (request, reply) => {
    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await getRunWalkPreparacaoRascunho(scope)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.put('/preparacao/rascunho', async (request, reply) => {
    const parsed = upsertPreparacaoRascunhoBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await putRunWalkPreparacaoRascunho(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/preparacao/rascunho', async (request, reply) => {
    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      await deleteRunWalkPreparacaoRascunho(scope)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/integracoes/leituras-tempo-real', async (request, reply) => {
    const parsed = runWalkIntegracoesLeiturasTempoRealQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await getRunWalkIntegracoesLeiturasTempoReal(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/health', async (request, reply) => {
    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const health = await getVdRunWalkHealth(scope)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(health)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/live-sessoes', async (request, reply) => {
    const parsed = createLiveSessionBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await createRunWalkLiveSession(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/live-sessoes/:id/pontos',
    { config: RUN_WALK_APPEND_LIVE_POINTS_RATE_LIMIT },
    async (request, reply) => {
    const parsedParams = runWalkLiveSessionIdParamsSchema.safeParse(request.params)
    if (!parsedParams.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedParams.error),
        code: 'INVALID_DATA',
      })
    }

    const parsedBody = appendLiveSessionPointsBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedBody.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await appendRunWalkLiveSessionPoints(
        scope,
        parsedParams.data.id,
        parsedBody.data,
      )
      auditRunWalkLivePointsAppended(request, scope, {
        sessionId: parsedParams.data.id,
        pointCount: parsedBody.data.points.length,
        acceptedCount: result.insertedCount,
      })
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/contatos-confianca', async (request, reply) => {
    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await getRunWalkContatosConfianca(scope)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/contatos-confianca', async (request, reply) => {
    const parsed = createContatoConfiancaBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await createRunWalkContatoConfianca(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.put('/contatos-confianca/:id', async (request, reply) => {
    const parsedParams = runWalkContatoConfiancaIdParamsSchema.safeParse(request.params)
    if (!parsedParams.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedParams.error),
        code: 'INVALID_DATA',
      })
    }

    const parsedBody = updateContatoConfiancaBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedBody.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await updateRunWalkContatoConfianca(
        scope,
        parsedParams.data.id,
        parsedBody.data,
      )
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/contatos-confianca/:id', async (request, reply) => {
    const parsedParams = runWalkContatoConfiancaIdParamsSchema.safeParse(request.params)
    if (!parsedParams.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedParams.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await deleteRunWalkContatoConfianca(scope, parsedParams.data.id)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/contatos-confianca/:id/ativar-sos', async (request, reply) => {
    const parsedParams = runWalkContatoConfiancaIdParamsSchema.safeParse(request.params)
    if (!parsedParams.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedParams.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await activateRunWalkContatoConfiancaSos(scope, parsedParams.data.id)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/locais', async (request, reply) => {
    const parsed = listRunWalkLocaisQuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await listRunWalkLocais(scope, parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/locais/capa-upload-url', async (request, reply) => {
    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await createRunWalkLocalCoverUploadUrl(scope)
      reply.header('Cache-Control', 'private, no-store')
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/locais', { config: RUN_WALK_CREATE_LOCAL_RATE_LIMIT }, async (request, reply) => {
    const parsed = createRunWalkLocalBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const { submittedByName, ...input } = parsed.data
      const result = await createRunWalkLocal(
        scope,
        input,
        submittedByName ?? request.vdUser?.nome ?? 'Participante',
      )
      auditRunWalkLocalCreated(request, scope, {
        localId: result.id,
        name: result.name,
        type: result.type,
      })
      reply.header('Cache-Control', 'private, no-store')
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/locais/:id/voto', async (request, reply) => {
    const parsedParams = runWalkLocalIdParamsSchema.safeParse(request.params)
    if (!parsedParams.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedParams.error),
        code: 'INVALID_DATA',
      })
    }

    const parsedBody = postRunWalkLocalVotoBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedBody.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await postRunWalkLocalVoto(
        scope,
        parsedParams.data.id,
        parsedBody.data.vote,
      )
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/locais/:id/comentarios', async (request, reply) => {
    const parsedParams = runWalkLocalIdParamsSchema.safeParse(request.params)
    if (!parsedParams.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedParams.error),
        code: 'INVALID_DATA',
      })
    }

    const parsedQuery = listRunWalkLocalComentariosQuerySchema.safeParse(request.query)
    if (!parsedQuery.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedQuery.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await listRunWalkLocalComentarios(
        scope,
        parsedParams.data.id,
        parsedQuery.data,
      )
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/locais/:id/comentarios', async (request, reply) => {
    const parsedParams = runWalkLocalIdParamsSchema.safeParse(request.params)
    if (!parsedParams.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedParams.error),
        code: 'INVALID_DATA',
      })
    }

    const parsedBody = createRunWalkLocalComentarioBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedBody.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await createRunWalkLocalComentario(
        scope,
        parsedParams.data.id,
        parsedBody.data.text,
        parsedBody.data.authorName ?? request.vdUser?.nome ?? 'Participante',
      )
      reply.header('Cache-Control', 'private, no-store')
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/live-sessoes/:id/encerrar', async (request, reply) => {
    const parsedParams = runWalkLiveSessionIdParamsSchema.safeParse(request.params)
    if (!parsedParams.success) {
      return reply.status(400).send({
        error: formatRunWalkValidationError(parsedParams.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const scope = getVdRunWalkPacienteScopeFromRequest(request)
      const result = await endRunWalkLiveSession(scope, parsedParams.data.id)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(result)
    } catch (error) {
      const mapped = mapVdRunWalkError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
