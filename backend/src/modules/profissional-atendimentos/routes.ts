import multipart from '@fastify/multipart'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  requireProfissionalAuth,
  requireAnyProfissionalPagePermission,
  requireProfissionalPagePermission,
} from '../profissional-auth/middleware.js'
import {
  registrarProfissionalAnexoDocumento,
  removerProfissionalAnexo,
  uploadProfissionalAnexo,
} from './anexos.service.js'
import {
  emitirProfissionalAtestadoPdf,
  emitirProfissionalPedidoExamePdf,
  emitirProfissionalReceitaPdf,
  resolveDocumentoDownloadUrlForConsulta,
} from './documentos-clinicos.service.js'
import { getProfissionalAtendimentoDetail } from './detail.service.js'
import {
  formatProfissionalAtendimentosValidationError,
  mapProfissionalAtendimentosError,
} from './errors.js'
import { listProfissionalExamCatalog, registrarProfissionalSolicitacaoExame } from './exames.service.js'
import { finalizarProfissionalAtendimento } from './finalizar.service.js'
import { listProfissionalFilaAtiva } from './fila-ativa.service.js'
import { iniciarProfissionalConsulta } from './iniciar.service.js'
import { listProfissionalAtendimentos } from './list.service.js'
import { enviarProfissionalMensagem, listProfissionalMensagens, uploadProfissionalMensagemAnexo } from './mensagens.service.js'
import { salvarProfissionalNotaProntuario } from './notas.service.js'
import { registrarProfissionalPrescricao } from './prescricoes.service.js'
import {
  anexoIdParamSchema,
  codigoAtendimentoParamSchema,
  consultaIdParamSchema,
  emitirAtestadoBodySchema,
  emitirPedidoExameBodySchema,
  emitirReceitaBodySchema,
  enviarMensagemBodySchema,
  finalizarAtendimentoBodySchema,
  iniciarConsultaBodySchema,
  listAtendimentosQuerySchema,
  registrarAnexoBodySchema,
  registrarPrescricaoBodySchema,
  registrarSolicitacaoExameBodySchema,
  salvarNotasBodySchema,
} from './schemas.js'
import {
  getProfissionalConsultaSessao,
  iniciarProfissionalConsultaPorCodigo,
} from './sessao.service.js'
import { getProfissionalConsultaVideoToken } from './video-token.service.js'

const MAX_ANEXO_BYTES = 10 * 1024 * 1024

const MESSAGE_RATE_LIMIT = {
  rateLimit: {
    max: 60,
    timeWindow: '1 minute',
  },
} as const

const canViewAtendimentos = requireProfissionalPagePermission('atendimentos', 'visualizar')
const canViewQueue = requireAnyProfissionalPagePermission(['agenda', 'atendimentos'], 'visualizar')
const canEditQueue = requireAnyProfissionalPagePermission(['agenda', 'atendimentos'], 'editar')

function profissionalId(request: FastifyRequest): string {
  return request.profissionalUser!.id
}

export async function registerProfissionalAtendimentosRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireProfissionalAuth)

  await app.register(multipart, {
    limits: {
      fileSize: MAX_ANEXO_BYTES,
      files: 1,
      fields: 8,
      parts: 10,
    },
  })

  app.get('/fila-ativa', { preHandler: canViewQueue }, async (request, reply) => {
    try {
      const fila = await listProfissionalFilaAtiva(profissionalId(request))
      reply.header('Cache-Control', 'private, max-age=5')
      return reply.send({ fila })
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/iniciar', { preHandler: canEditQueue }, async (request, reply) => {
    const parsed = iniciarConsultaBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatProfissionalAtendimentosValidationError(parsed.error) })
    }

    try {
      const result = await iniciarProfissionalConsulta(profissionalId(request), parsed.data)
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/catalogo/exames', { preHandler: canViewQueue }, async (_request, reply) => {
    try {
      const catalog = await listProfissionalExamCatalog()
      reply.header('Cache-Control', 'private, max-age=300')
      return reply.send({ catalog })
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/', { preHandler: canViewAtendimentos }, async (request, reply) => {
    const parsed = listAtendimentosQuerySchema.safeParse(request.query ?? {})
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatProfissionalAtendimentosValidationError(parsed.error) })
    }

    try {
      const result = await listProfissionalAtendimentos(profissionalId(request), parsed.data)
      reply.header('Cache-Control', 'private, max-age=15')
      return reply.send(result)
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/sessao/:codigoAtendimento', { preHandler: canViewQueue }, async (request, reply) => {
    const params = codigoAtendimentoParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Código de atendimento inválido.' })
    }

    try {
      const sessao = await getProfissionalConsultaSessao(
        profissionalId(request),
        params.data.codigoAtendimento,
      )
      reply.header('Cache-Control', 'private, no-cache')
      return reply.send({ sessao })
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/sessao/:codigoAtendimento/iniciar',
    { preHandler: canEditQueue },
    async (request, reply) => {
      const params = codigoAtendimentoParamSchema.safeParse(request.params)
      if (!params.success) {
        return reply.status(400).send({ error: 'Código de atendimento inválido.' })
      }

      try {
        const sessao = await iniciarProfissionalConsultaPorCodigo(
          profissionalId(request),
          params.data.codigoAtendimento,
        )
        return reply.send({ sessao })
      } catch (error) {
        const mapped = mapProfissionalAtendimentosError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.get('/:codigoAtendimento/video-token', { preHandler: canViewQueue }, async (request, reply) => {
    const params = codigoAtendimentoParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Código de atendimento inválido.' })
    }

    try {
      const videoToken = await getProfissionalConsultaVideoToken(
        profissionalId(request),
        request.profissionalUser!.nome,
        params.data.codigoAtendimento,
      )
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(videoToken)
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:consultaId/mensagens', { preHandler: canViewQueue }, async (request, reply) => {
    const params = consultaIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    try {
      const mensagens = await listProfissionalMensagens(
        profissionalId(request),
        params.data.consultaId,
      )
      reply.header('Cache-Control', 'private, no-cache')
      return reply.send({ mensagens })
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:consultaId/mensagens', { preHandler: canEditQueue, config: MESSAGE_RATE_LIMIT }, async (request, reply) => {
    const params = consultaIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    const parsed = enviarMensagemBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatProfissionalAtendimentosValidationError(parsed.error) })
    }

    try {
      await enviarProfissionalMensagem(
        profissionalId(request),
        params.data.consultaId,
        parsed.data.conteudo,
      )
      return reply.status(201).send({ ok: true })
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/:consultaId/mensagens/upload',
    { preHandler: canEditQueue, config: MESSAGE_RATE_LIMIT },
    async (request, reply) => {
      const params = consultaIdParamSchema.safeParse(request.params)
      if (!params.success) {
        return reply.status(400).send({ error: 'Identificador inválido.' })
      }

      try {
        let file: { buffer: Buffer; mimeType: string; fileName: string } | null = null
        let conteudo = ''

        for await (const part of request.parts()) {
          if (part.type === 'field') {
            if (part.fieldname === 'conteudo') conteudo = String(part.value)
            continue
          }

          if (part.fieldname === 'file') {
            const buffer = await part.toBuffer()
            file = {
              buffer,
              mimeType: part.mimetype,
              fileName: part.filename,
            }
          }
        }

        if (!file) {
          return reply.status(400).send({ error: 'Arquivo não informado.' })
        }

        await uploadProfissionalMensagemAnexo(
          profissionalId(request),
          params.data.consultaId,
          file,
          conteudo || undefined,
        )

        return reply.status(201).send({ ok: true })
      } catch (error) {
        const mapped = mapProfissionalAtendimentosError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.patch('/:consultaId/notas', { preHandler: canEditQueue }, async (request, reply) => {
    const params = consultaIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    const parsed = salvarNotasBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatProfissionalAtendimentosValidationError(parsed.error) })
    }

    try {
      const result = await salvarProfissionalNotaProntuario(
        profissionalId(request),
        params.data.consultaId,
        parsed.data.nota,
        parsed.data.modo,
      )
      return reply.send(result)
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:consultaId/prescricoes/emitir', { preHandler: canEditQueue }, async (request, reply) => {
    const params = consultaIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    const parsed = emitirReceitaBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatProfissionalAtendimentosValidationError(parsed.error) })
    }

    try {
      const result = await emitirProfissionalReceitaPdf(
        profissionalId(request),
        params.data.consultaId,
        parsed.data,
      )
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:consultaId/prescricoes', { preHandler: canEditQueue }, async (request, reply) => {
    const params = consultaIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    const parsed = registrarPrescricaoBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatProfissionalAtendimentosValidationError(parsed.error) })
    }

    try {
      await registrarProfissionalPrescricao(
        profissionalId(request),
        params.data.consultaId,
        parsed.data,
      )
      return reply.status(201).send({ ok: true })
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/:consultaId/solicitacoes-exame/emitir',
    { preHandler: canEditQueue },
    async (request, reply) => {
      const params = consultaIdParamSchema.safeParse(request.params)
      if (!params.success) {
        return reply.status(400).send({ error: 'Identificador inválido.' })
      }

      const parsed = emitirPedidoExameBodySchema.safeParse(request.body ?? {})
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: formatProfissionalAtendimentosValidationError(parsed.error) })
      }

      try {
        const result = await emitirProfissionalPedidoExamePdf(
          profissionalId(request),
          params.data.consultaId,
          parsed.data,
        )
        return reply.status(201).send(result)
      } catch (error) {
        const mapped = mapProfissionalAtendimentosError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post(
    '/:consultaId/solicitacoes-exame',
    { preHandler: canEditQueue },
    async (request, reply) => {
      const params = consultaIdParamSchema.safeParse(request.params)
      if (!params.success) {
        return reply.status(400).send({ error: 'Identificador inválido.' })
      }

      const parsed = registrarSolicitacaoExameBodySchema.safeParse(request.body ?? {})
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: formatProfissionalAtendimentosValidationError(parsed.error) })
      }

      try {
        await registrarProfissionalSolicitacaoExame(
          profissionalId(request),
          params.data.consultaId,
          parsed.data.exameId,
          parsed.data.observacoes,
        )
        return reply.status(201).send({ ok: true })
      } catch (error) {
        const mapped = mapProfissionalAtendimentosError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post('/:consultaId/atestados/emitir', { preHandler: canEditQueue }, async (request, reply) => {
    const params = consultaIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    const parsed = emitirAtestadoBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatProfissionalAtendimentosValidationError(parsed.error) })
    }

    try {
      const result = await emitirProfissionalAtestadoPdf(
        profissionalId(request),
        params.data.consultaId,
        parsed.data,
      )
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:consultaId/documentos/:documentId/download', { preHandler: canViewQueue }, async (request, reply) => {
    const params = anexoIdParamSchema.safeParse({
      consultaId: (request.params as { consultaId?: string }).consultaId,
      anexoId: (request.params as { documentId?: string }).documentId,
    })
    if (!params.success) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    const documentId = String((request.params as { documentId?: string }).documentId ?? '')
    if (!documentId.startsWith('anexo-')) {
      return reply.status(404).send({ error: 'Documento não encontrado.' })
    }

    try {
      const url = await resolveDocumentoDownloadUrlForConsulta(
        profissionalId(request),
        params.data.consultaId,
        documentId.slice('anexo-'.length),
      )
      reply.header('Cache-Control', 'private, no-store')
      return reply.send({ url })
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:consultaId/anexos', { preHandler: canEditQueue }, async (request, reply) => {
    const params = consultaIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    const parsed = registrarAnexoBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatProfissionalAtendimentosValidationError(parsed.error) })
    }

    try {
      const result = await registrarProfissionalAnexoDocumento(
        profissionalId(request),
        params.data.consultaId,
        parsed.data,
      )
      return reply.status(201).send(result)
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:consultaId/anexos/upload', { preHandler: canEditQueue, config: MESSAGE_RATE_LIMIT }, async (request, reply) => {
    const params = consultaIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    try {
      let file: { buffer: Buffer; mimeType: string; fileName: string } | null = null
      let titulo = ''
      let tipo = ''

      for await (const part of request.parts()) {
        if (part.type === 'field') {
          if (part.fieldname === 'titulo') titulo = String(part.value)
          if (part.fieldname === 'tipo') tipo = String(part.value)
          continue
        }

        if (part.fieldname === 'file') {
          const buffer = await part.toBuffer()
          file = {
            buffer,
            mimeType: part.mimetype,
            fileName: part.filename,
          }
        }
      }

      if (!file) {
        return reply.status(400).send({ error: 'Arquivo não informado.' })
      }

      const anexo = await uploadProfissionalAnexo(
        profissionalId(request),
        params.data.consultaId,
        file,
        { titulo: titulo || undefined, tipo: tipo || undefined },
      )

      return reply.status(201).send({ anexo })
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.delete('/:consultaId/anexos/:anexoId', { preHandler: canEditQueue }, async (request, reply) => {
    const params = anexoIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    try {
      await removerProfissionalAnexo(
        profissionalId(request),
        params.data.consultaId,
        params.data.anexoId,
      )
      return reply.send({ ok: true })
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:consultaId/finalizar', { preHandler: canEditQueue }, async (request, reply) => {
    const params = consultaIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    const parsed = finalizarAtendimentoBodySchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: formatProfissionalAtendimentosValidationError(parsed.error) })
    }

    try {
      await finalizarProfissionalAtendimento(
        profissionalId(request),
        params.data.consultaId,
        parsed.data,
      )
      return reply.send({ ok: true })
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:consultaId', { preHandler: canViewAtendimentos }, async (request, reply) => {
    const params = consultaIdParamSchema.safeParse(request.params)
    if (!params.success) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    try {
      const detail = await getProfissionalAtendimentoDetail(
        profissionalId(request),
        params.data.consultaId,
      )
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send(detail)
    } catch (error) {
      const mapped = mapProfissionalAtendimentosError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
