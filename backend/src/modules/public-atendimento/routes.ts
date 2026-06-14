import multipart from '@fastify/multipart'
import type { FastifyInstance } from 'fastify'
import {
  formatPublicAtendimentoValidationError,
  mapPublicAtendimentoError,
} from './errors.js'
import { getPublicDocumentoDownloadUrl, listPublicDocumentos } from './documentos.service.js'
import { verificarDocumentoClinico } from './verificacao.service.js'
import {
  codigoAtendimentoParamSchema,
  codigoVerificacaoParamSchema,
  enviarPublicMensagemBodySchema,
  registrarAvaliacaoPublicaBodySchema,
} from './schemas.js'
import {
  enviarPublicMensagem,
  listPublicMensagens,
  uploadPublicMensagem,
} from './mensagens.service.js'
import { getPublicAvaliacaoSessao, registrarPublicAvaliacao } from './avaliacao.service.js'
import { getPublicAtendimentoSessao, getPublicFilaStatus, registrarPacienteEntradaSalaAtendimento } from './sessao.service.js'
import { getPublicConsultaVideoToken } from './video-token.service.js'
import { MAX_MENSAGEM_ANEXO_BYTES } from '../profissional-atendimentos/mensagens.service.js'

const PUBLIC_MESSAGE_RATE_LIMIT = {
  rateLimit: {
    max: 60,
    timeWindow: '1 minute',
  },
} as const

const PUBLIC_AVALIACAO_RATE_LIMIT = {
  rateLimit: {
    max: 10,
    timeWindow: '1 minute',
  },
} as const

const PUBLIC_VERIFICACAO_RATE_LIMIT = {
  rateLimit: {
    max: 30,
    timeWindow: '1 minute',
  },
} as const

export async function registerPublicAtendimentoRoutes(app: FastifyInstance): Promise<void> {
  await app.register(multipart, {
    limits: {
      fileSize: MAX_MENSAGEM_ANEXO_BYTES,
      files: 1,
      fields: 4,
      parts: 6,
    },
  })

  app.get('/verificar/:codigo', { config: PUBLIC_VERIFICACAO_RATE_LIMIT }, async (request, reply) => {
    const parsed = codigoVerificacaoParamSchema.safeParse(
      (request.params as { codigo?: string }).codigo,
    )
    if (!parsed.success) {
      return reply.status(400).send({ error: formatPublicAtendimentoValidationError(parsed.error) })
    }

    try {
      const result = await verificarDocumentoClinico(parsed.data)
      reply.header('Cache-Control', 'public, max-age=60')
      return reply.send(result)
    } catch (error) {
      const mapped = mapPublicAtendimentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:codigo/sessao', async (request, reply) => {
    const parsed = codigoAtendimentoParamSchema.safeParse(
      (request.params as { codigo?: string }).codigo,
    )
    if (!parsed.success) {
      return reply.status(400).send({ error: formatPublicAtendimentoValidationError(parsed.error) })
    }

    try {
      const sessao = await getPublicAtendimentoSessao(parsed.data)
      reply.header('Cache-Control', 'private, no-cache')
      return reply.send(sessao)
    } catch (error) {
      const mapped = mapPublicAtendimentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:codigo/video-token', async (request, reply) => {
    const parsed = codigoAtendimentoParamSchema.safeParse(
      (request.params as { codigo?: string }).codigo,
    )
    if (!parsed.success) {
      return reply.status(400).send({ error: formatPublicAtendimentoValidationError(parsed.error) })
    }

    try {
      const videoToken = await getPublicConsultaVideoToken(parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(videoToken)
    } catch (error) {
      const mapped = mapPublicAtendimentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:codigo/fila', async (request, reply) => {
    const parsed = codigoAtendimentoParamSchema.safeParse(
      (request.params as { codigo?: string }).codigo,
    )
    if (!parsed.success) {
      return reply.status(400).send({ error: formatPublicAtendimentoValidationError(parsed.error) })
    }

    try {
      const fila = await getPublicFilaStatus(parsed.data)
      reply.header('Cache-Control', 'private, no-cache')
      return reply.send(fila)
    } catch (error) {
      const mapped = mapPublicAtendimentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:codigo/entrar-sala-atendimento', async (request, reply) => {
    const parsed = codigoAtendimentoParamSchema.safeParse(
      (request.params as { codigo?: string }).codigo,
    )
    if (!parsed.success) {
      return reply.status(400).send({ error: formatPublicAtendimentoValidationError(parsed.error) })
    }

    try {
      await registrarPacienteEntradaSalaAtendimento(parsed.data)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapPublicAtendimentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:codigo/documentos', async (request, reply) => {
    const parsed = codigoAtendimentoParamSchema.safeParse(
      (request.params as { codigo?: string }).codigo,
    )
    if (!parsed.success) {
      return reply.status(400).send({ error: formatPublicAtendimentoValidationError(parsed.error) })
    }

    try {
      const documentos = await listPublicDocumentos(parsed.data)
      reply.header('Cache-Control', 'private, no-cache')
      return reply.send({ documentos })
    } catch (error) {
      const mapped = mapPublicAtendimentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:codigo/documentos/:documentId/download', async (request, reply) => {
    const parsedCodigo = codigoAtendimentoParamSchema.safeParse(
      (request.params as { codigo?: string }).codigo,
    )
    if (!parsedCodigo.success) {
      return reply.status(400).send({ error: formatPublicAtendimentoValidationError(parsedCodigo.error) })
    }

    const documentId = String((request.params as { documentId?: string }).documentId ?? '')
    if (!documentId.startsWith('anexo-')) {
      return reply.status(404).send({ error: 'Documento não encontrado.' })
    }

    try {
      const url = await getPublicDocumentoDownloadUrl(parsedCodigo.data, documentId)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send({ url })
    } catch (error) {
      const mapped = mapPublicAtendimentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/:codigo/mensagens', async (request, reply) => {
    const parsed = codigoAtendimentoParamSchema.safeParse(
      (request.params as { codigo?: string }).codigo,
    )
    if (!parsed.success) {
      return reply.status(400).send({ error: formatPublicAtendimentoValidationError(parsed.error) })
    }

    try {
      const mensagens = await listPublicMensagens(parsed.data)
      reply.header('Cache-Control', 'private, no-cache')
      return reply.send({ mensagens })
    } catch (error) {
      const mapped = mapPublicAtendimentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:codigo/mensagens', { config: PUBLIC_MESSAGE_RATE_LIMIT }, async (request, reply) => {
    const parsedCodigo = codigoAtendimentoParamSchema.safeParse(
      (request.params as { codigo?: string }).codigo,
    )
    if (!parsedCodigo.success) {
      return reply
        .status(400)
        .send({ error: formatPublicAtendimentoValidationError(parsedCodigo.error) })
    }

    const parsedBody = enviarPublicMensagemBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return reply.status(400).send({ error: formatPublicAtendimentoValidationError(parsedBody.error) })
    }

    try {
      await enviarPublicMensagem(parsedCodigo.data, parsedBody.data.conteudo)
      return reply.status(201).send({ ok: true })
    } catch (error) {
      const mapped = mapPublicAtendimentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/:codigo/mensagens/upload',
    { config: PUBLIC_MESSAGE_RATE_LIMIT },
    async (request, reply) => {
      const parsedCodigo = codigoAtendimentoParamSchema.safeParse(
        (request.params as { codigo?: string }).codigo,
      )
      if (!parsedCodigo.success) {
        return reply
          .status(400)
          .send({ error: formatPublicAtendimentoValidationError(parsedCodigo.error) })
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

        await uploadPublicMensagem(parsedCodigo.data, file, conteudo || undefined)
        return reply.status(201).send({ ok: true })
      } catch (error) {
        const mapped = mapPublicAtendimentoError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.get('/:codigo/avaliacao', async (request, reply) => {
    const parsed = codigoAtendimentoParamSchema.safeParse(
      (request.params as { codigo?: string }).codigo,
    )
    if (!parsed.success) {
      return reply.status(400).send({ error: formatPublicAtendimentoValidationError(parsed.error) })
    }

    try {
      const sessao = await getPublicAvaliacaoSessao(parsed.data)
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(sessao)
    } catch (error) {
      const mapped = mapPublicAtendimentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/:codigo/avaliacao', { config: PUBLIC_AVALIACAO_RATE_LIMIT }, async (request, reply) => {
    const parsedCodigo = codigoAtendimentoParamSchema.safeParse(
      (request.params as { codigo?: string }).codigo,
    )
    if (!parsedCodigo.success) {
      return reply
        .status(400)
        .send({ error: formatPublicAtendimentoValidationError(parsedCodigo.error) })
    }

    const parsedBody = registrarAvaliacaoPublicaBodySchema.safeParse(request.body)
    if (!parsedBody.success) {
      return reply.status(400).send({ error: formatPublicAtendimentoValidationError(parsedBody.error) })
    }

    try {
      await registrarPublicAvaliacao(parsedCodigo.data, parsedBody.data)
      return reply.status(204).send()
    } catch (error) {
      const mapped = mapPublicAtendimentoError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
