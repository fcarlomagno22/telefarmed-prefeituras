import { randomUUID } from 'node:crypto'
import multipart from '@fastify/multipart'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import {
  createPendingCandidaturaDocumentUploadUrls,
  submitCandidaturaProfissional,
  submitCandidaturaProfissionalFromStorage,
} from './cadastro.service.js'
import {
  formatCadastroValidationError,
  mapProfissionalCadastroError,
  ProfissionalCadastroError,
} from './errors.js'
import { consultarCnpjEmpresa } from './cnpj.service.js'
import { finalizeProfissionalCadastro, createFinalizarSelfieUploadUrl, validateProfissionalAccessCode } from './finalizar.service.js'
import {
  accessCodeParamSchema,
  consultarCnpjParamSchema,
  finalizarCadastroBodySchema,
  finalizarCadastroMultipartDadosSchema,
  finalizarCadastroStoragePathBodySchema,
  validarCodigoBodySchema,
} from './finalizar.schemas.js'
import {
  consultarMinhaCandidatura,
  corrigirDadosMinhaCandidatura,
  enviarCorrecoesMinhaCandidatura,
  reenviarDocumentoMinhaCandidatura,
} from './minha-candidatura.service.js'
import {
  consultarMinhaCandidaturaBodySchema,
  corrigirDadosMinhaCandidaturaBodySchema,
  documentoParamSchema,
} from './minha-candidatura.schemas.js'
import { candidaturaDadosSchema, candidaturaDocumentosUploadUrlBodySchema, candidaturaSubmitStorageBodySchema } from './schemas.js'

const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024

const candidaturaRateLimit = {
  config: {
    rateLimit: {
      max: 6,
      timeWindow: '1 minute',
    },
  },
}

const finalizarRateLimit = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: '1 minute',
    },
  },
}

const cnpjLookupRateLimit = {
  config: {
    rateLimit: {
      max: 12,
      timeWindow: '1 minute',
    },
  },
}

async function handleCandidaturaSubmit(request: FastifyRequest, reply: FastifyReply) {
  try {
    let dadosRaw: string | null = null
    const documents: Array<{
      fieldId: string
      buffer: Buffer
      mimeType: string
      fileName: string
    }> = []

    for await (const part of request.parts()) {
      if (part.type === 'field') {
        if (part.fieldname === 'dados') {
          dadosRaw = String(part.value)
        }
        continue
      }

      const buffer = await part.toBuffer()
      documents.push({
        fieldId: part.fieldname,
        buffer,
        mimeType: part.mimetype,
        fileName: part.filename,
      })
    }

    if (!dadosRaw) {
      throw new ProfissionalCadastroError('Dados do formulário ausentes.', 'INVALID_DATA', 400)
    }

    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(dadosRaw)
    } catch {
      throw new ProfissionalCadastroError('Formato de dados inválido.', 'INVALID_DATA', 400)
    }

    const parsed = candidaturaDadosSchema.safeParse(parsedJson)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatCadastroValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    const result = await submitCandidaturaProfissional(parsed.data, documents)
    return reply.status(201).send(result)
  } catch (error) {
    const mapped = mapProfissionalCadastroError(error)
    return reply.status(mapped.statusCode).send(mapped.body)
  }
}

async function handleCandidaturaSubmitStorage(request: FastifyRequest, reply: FastifyReply) {
  const parsed = candidaturaSubmitStorageBodySchema.safeParse(request.body)
  if (!parsed.success) {
    return reply.status(400).send({
      error: formatCadastroValidationError(parsed.error),
      code: 'INVALID_DATA',
    })
  }

  try {
    const result = await submitCandidaturaProfissionalFromStorage(
      parsed.data.dados,
      parsed.data.submissionId,
      parsed.data.documentos,
    )
    return reply.status(201).send(result)
  } catch (error) {
    const mapped = mapProfissionalCadastroError(error)
    return reply.status(mapped.statusCode).send(mapped.body)
  }
}

export async function registerProfissionalCadastroRoutes(app: FastifyInstance): Promise<void> {
  await app.register(multipart, {
    limits: {
      fileSize: MAX_DOCUMENT_BYTES,
      files: 4,
      // consulta de acesso (2) + correção de dados (até 5) + margem
      fields: 12,
      parts: 16,
    },
  })

  app.post('/documentos-upload-url', candidaturaRateLimit, async (request, reply) => {
    const parsed = candidaturaDocumentosUploadUrlBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: formatCadastroValidationError(parsed.error),
        code: 'INVALID_DATA',
      })
    }

    try {
      const submissionId = parsed.data.submissionId ?? randomUUID()
      const uploads = await createPendingCandidaturaDocumentUploadUrls(
        submissionId,
        parsed.data.documentos,
      )
      return reply.send({ submissionId, uploads })
    } catch (error) {
      const mapped = mapProfissionalCadastroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/', candidaturaRateLimit, async (request, reply) => {
    const contentType = request.headers['content-type'] ?? ''
    if (contentType.includes('application/json')) {
      return handleCandidaturaSubmitStorage(request, reply)
    }
    return handleCandidaturaSubmit(request, reply)
  })
  app.post('/candidatura', candidaturaRateLimit, async (request, reply) => {
    const contentType = request.headers['content-type'] ?? ''
    if (contentType.includes('application/json')) {
      return handleCandidaturaSubmitStorage(request, reply)
    }
    return handleCandidaturaSubmit(request, reply)
  })

  async function handleValidateAccessCode(code: string, reply: FastifyReply) {
    try {
      const profissional = await validateProfissionalAccessCode(code)
      return reply.send({ profissional })
    } catch (error) {
      const mapped = mapProfissionalCadastroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  }

  app.get('/validar-codigo/:code', finalizarRateLimit, async (request, reply) => {
    const parsed = accessCodeParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Código inválido.', code: 'INVALID_ACCESS_CODE' })
    }

    return handleValidateAccessCode(parsed.data.code, reply)
  })

  app.post('/validar-codigo', finalizarRateLimit, async (request, reply) => {
    const parsed = validarCodigoBodySchema.safeParse(request.body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return reply.status(400).send({
        error: issue?.message ?? 'Código inválido.',
        code: 'INVALID_ACCESS_CODE',
      })
    }

    return handleValidateAccessCode(parsed.data.accessCode, reply)
  })

  app.get('/consultar-cnpj/:cnpj', cnpjLookupRateLimit, async (request, reply) => {
    const parsed = consultarCnpjParamSchema.safeParse(request.params)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'CNPJ inválido.', code: 'INVALID_DATA' })
    }

    try {
      const empresa = await consultarCnpjEmpresa(parsed.data.cnpj)
      return reply.send({ empresa })
    } catch (error) {
      const mapped = mapProfissionalCadastroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/minha-candidatura/consultar', candidaturaRateLimit, async (request, reply) => {
    const parsed = consultarMinhaCandidaturaBodySchema.safeParse(request.body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return reply.status(400).send({
        error: issue?.message ?? 'Dados inválidos.',
        code: 'INVALID_DATA',
      })
    }

    try {
      const candidatura = await consultarMinhaCandidatura(parsed.data.cpf, parsed.data.birthDate)
      return reply.send({ candidatura })
    } catch (error) {
      const mapped = mapProfissionalCadastroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/minha-candidatura/enviar-correcoes', candidaturaRateLimit, async (request, reply) => {
    try {
      let cpf: string | null = null
      let birthDate: string | null = null
      let email: string | undefined
      let telefone: string | undefined
      let conselhoNumero: string | undefined
      let conselhoUf: string | undefined
      let rqe: string | undefined
      const documentos: Array<{
        documentoId: string
        buffer: Buffer
        mimeType: string
        fileName: string
      }> = []

      for await (const part of request.parts()) {
        if (part.type === 'field') {
          const value = String(part.value)
          if (part.fieldname === 'cpf') cpf = value
          if (part.fieldname === 'birthDate') birthDate = value
          if (part.fieldname === 'email') email = value
          if (part.fieldname === 'telefone') telefone = value
          if (part.fieldname === 'conselhoNumero') conselhoNumero = value
          if (part.fieldname === 'conselhoUf') conselhoUf = value
          if (part.fieldname === 'rqe') rqe = value
          continue
        }

        const documentoId = part.fieldname.startsWith('documento_')
          ? part.fieldname.slice('documento_'.length)
          : null

        if (!documentoId) continue

        documentos.push({
          documentoId,
          buffer: await part.toBuffer(),
          mimeType: part.mimetype,
          fileName: part.filename,
        })
      }

      const accessParsed = consultarMinhaCandidaturaBodySchema.safeParse({ cpf, birthDate })
      if (!accessParsed.success) {
        const issue = accessParsed.error.issues[0]
        return reply.status(400).send({
          error: issue?.message ?? 'CPF e data de nascimento são obrigatórios.',
          code: 'INVALID_DATA',
        })
      }

      const dadosParsed = corrigirDadosMinhaCandidaturaBodySchema.safeParse({
        cpf,
        birthDate,
        ...(email ? { email } : {}),
        ...(telefone ? { telefone } : {}),
        ...(conselhoNumero ? { conselhoNumero } : {}),
        ...(conselhoUf ? { conselhoUf } : {}),
        ...(rqe !== undefined ? { rqe } : {}),
      })

      const hasDados =
        Boolean(email) ||
        Boolean(telefone) ||
        Boolean(conselhoNumero) ||
        Boolean(conselhoUf) ||
        rqe !== undefined

      if (hasDados && !dadosParsed.success) {
        const issue = dadosParsed.error.issues[0]
        return reply.status(400).send({
          error: issue?.message ?? 'Dados de correção inválidos.',
          code: 'INVALID_DATA',
        })
      }

      const candidatura = await enviarCorrecoesMinhaCandidatura(
        accessParsed.data.cpf,
        accessParsed.data.birthDate,
        {
          ...(hasDados && dadosParsed.success
            ? {
                dados: {
                  ...(dadosParsed.data.email ? { email: dadosParsed.data.email } : {}),
                  ...(dadosParsed.data.telefone ? { telefone: dadosParsed.data.telefone } : {}),
                  ...(dadosParsed.data.conselhoNumero
                    ? { conselhoNumero: dadosParsed.data.conselhoNumero }
                    : {}),
                  ...(dadosParsed.data.conselhoUf
                    ? { conselhoUf: dadosParsed.data.conselhoUf }
                    : {}),
                  ...(dadosParsed.data.rqe !== undefined ? { rqe: dadosParsed.data.rqe } : {}),
                },
              }
            : {}),
          documentos,
        },
      )
      return reply.send({ candidatura })
    } catch (error) {
      const mapped = mapProfissionalCadastroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/minha-candidatura/corrigir-dados', candidaturaRateLimit, async (request, reply) => {
    const parsed = corrigirDadosMinhaCandidaturaBodySchema.safeParse(request.body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return reply.status(400).send({
        error: issue?.message ?? 'Dados inválidos.',
        code: 'INVALID_DATA',
      })
    }

    try {
      const candidatura = await corrigirDadosMinhaCandidatura(
        parsed.data.cpf,
        parsed.data.birthDate,
        {
          ...(parsed.data.email ? { email: parsed.data.email } : {}),
          ...(parsed.data.telefone ? { telefone: parsed.data.telefone } : {}),
          ...(parsed.data.conselhoNumero ? { conselhoNumero: parsed.data.conselhoNumero } : {}),
          ...(parsed.data.conselhoUf ? { conselhoUf: parsed.data.conselhoUf } : {}),
          ...(parsed.data.rqe !== undefined ? { rqe: parsed.data.rqe } : {}),
        },
      )
      return reply.send({ candidatura })
    } catch (error) {
      const mapped = mapProfissionalCadastroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post(
    '/minha-candidatura/documentos/:documentoId/reenviar',
    candidaturaRateLimit,
    async (request, reply) => {
      const paramsParsed = documentoParamSchema.safeParse(request.params)
      if (!paramsParsed.success) {
        return reply.status(400).send({ error: 'Documento inválido.', code: 'INVALID_DATA' })
      }

      let cpf: string | null = null
      let birthDate: string | null = null
      let fileBuffer: Buffer | null = null
      let mimeType = 'application/octet-stream'
      let fileName = 'documento'

      for await (const part of request.parts()) {
        if (part.type === 'field') {
          if (part.fieldname === 'cpf') cpf = String(part.value)
          if (part.fieldname === 'birthDate') birthDate = String(part.value)
          continue
        }

        fileBuffer = await part.toBuffer()
        mimeType = part.mimetype
        fileName = part.filename
      }

      const accessParsed = consultarMinhaCandidaturaBodySchema.safeParse({ cpf, birthDate })
      if (!accessParsed.success) {
        const issue = accessParsed.error.issues[0]
        return reply.status(400).send({
          error: issue?.message ?? 'CPF e data de nascimento são obrigatórios.',
          code: 'INVALID_DATA',
        })
      }

      if (!fileBuffer || fileBuffer.length === 0) {
        return reply.status(400).send({
          error: 'Arquivo do documento é obrigatório.',
          code: 'INVALID_DATA',
        })
      }

      try {
        const candidatura = await reenviarDocumentoMinhaCandidatura(
          accessParsed.data.cpf,
          accessParsed.data.birthDate,
          paramsParsed.data.documentoId,
          fileBuffer,
          mimeType,
          fileName,
        )
        return reply.send({ candidatura })
      } catch (error) {
        const mapped = mapProfissionalCadastroError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    },
  )

  app.post('/finalizar-cadastro/selfie-upload-url', finalizarRateLimit, async (request, reply) => {
    const parsed = validarCodigoBodySchema.safeParse(request.body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return reply.status(400).send({
        error: issue?.message ?? 'Código inválido.',
        code: 'INVALID_ACCESS_CODE',
      })
    }

    try {
      const upload = await createFinalizarSelfieUploadUrl(parsed.data.accessCode)
      return reply.send(upload)
    } catch (error) {
      const mapped = mapProfissionalCadastroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/finalizar-cadastro', finalizarRateLimit, async (request, reply) => {
    const parsed = finalizarCadastroStoragePathBodySchema.safeParse(request.body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return reply.status(400).send({
        error: issue?.message ?? 'Dados inválidos.',
        code: 'INVALID_DATA',
      })
    }

    try {
      const result = await finalizeProfissionalCadastro(
        parsed.data.values,
        parsed.data.empresa,
        { storagePath: parsed.data.selfieStoragePath },
      )
      return reply.send(result)
    } catch (error) {
      const mapped = mapProfissionalCadastroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/finalizar-cadastro', finalizarRateLimit, async (request, reply) => {
    const contentType = request.headers['content-type'] ?? ''

    if (contentType.includes('multipart/form-data')) {
      try {
        let dadosRaw: string | null = null
        let selfieBuffer: Buffer | null = null
        let selfieMime: string | null = null

        for await (const part of request.parts()) {
          if (part.type === 'field') {
            if (part.fieldname === 'dados') {
              dadosRaw = String(part.value)
            }
            continue
          }

          if (part.fieldname === 'selfie') {
            selfieBuffer = await part.toBuffer()
            selfieMime = part.mimetype
          }
        }

        if (!dadosRaw) {
          throw new ProfissionalCadastroError('Dados do formulário ausentes.', 'INVALID_DATA', 400)
        }

        if (!selfieBuffer || !selfieMime) {
          throw new ProfissionalCadastroError(
            'Envie a foto de identificação.',
            'INVALID_DATA',
            400,
          )
        }

        let parsedJson: unknown
        try {
          parsedJson = JSON.parse(dadosRaw)
        } catch {
          throw new ProfissionalCadastroError('Formato de dados inválido.', 'INVALID_DATA', 400)
        }

        const parsed = finalizarCadastroMultipartDadosSchema.safeParse(parsedJson)
        if (!parsed.success) {
          const issue = parsed.error.issues[0]
          return reply.status(400).send({
            error: issue?.message ?? 'Dados inválidos.',
            code: 'INVALID_DATA',
          })
        }

        const result = await finalizeProfissionalCadastro(
          parsed.data.values,
          parsed.data.empresa,
          { buffer: selfieBuffer, mimeType: selfieMime },
        )
        return reply.send(result)
      } catch (error) {
        const mapped = mapProfissionalCadastroError(error)
        return reply.status(mapped.statusCode).send(mapped.body)
      }
    }

    const parsed = finalizarCadastroBodySchema.safeParse(request.body)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return reply.status(400).send({
        error: issue?.message ?? 'Dados inválidos.',
        code: 'INVALID_DATA',
      })
    }

    try {
      const { selfiePhotoDataUrl, ...values } = parsed.data.values
      const result = await finalizeProfissionalCadastro(
        values,
        parsed.data.empresa,
        { selfiePhotoDataUrl },
      )
      return reply.send(result)
    } catch (error) {
      const mapped = mapProfissionalCadastroError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
