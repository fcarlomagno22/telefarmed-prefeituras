import multipart from '@fastify/multipart'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  requireProfissionalAuth,
  requireProfissionalPagePermission,
} from '../profissional-auth/middleware.js'
import {
  getProfissionalDocumentoPreviewUrl,
  listProfissionalPerfilDocumentos,
  replaceProfissionalDocumento,
} from './documentos.service.js'
import {
  formatProfissionalPerfilValidationError,
  mapProfissionalPerfilError,
  ProfissionalPerfilError,
} from './errors.js'
import { updateProfissionalFoto } from './foto.service.js'
import { getProfissionalPerfil, patchProfissionalPerfil } from './profile.service.js'
import { uploadCertificadoA1, vincularCertificadoConselho } from './certificado.service.js'
import { patchProfissionalPerfilSchema, uploadFotoSchema } from './schemas.js'

const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024
const MAX_CERT_BYTES = 5 * 1024 * 1024

const canView = requireProfissionalPagePermission('perfil', 'visualizar')
const canEdit = requireProfissionalPagePermission('perfil', 'editar')

function ctx(request: FastifyRequest) {
  return { profissionalId: request.profissionalUser!.id }
}

export async function registerProfissionalPerfilRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireProfissionalAuth)

  await app.register(multipart, {
    limits: {
      fileSize: MAX_DOCUMENT_BYTES,
      files: 1,
      fields: 4,
      parts: 6,
    },
  })

  app.get('/', { preHandler: canView }, async (request, reply) => {
    try {
      const profile = await getProfissionalPerfil(ctx(request))
      reply.header('Cache-Control', 'private, no-store')
      return reply.send(profile)
    } catch (error) {
      const mapped = mapProfissionalPerfilError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.patch('/', { preHandler: canEdit }, async (request, reply) => {
    const parsed = patchProfissionalPerfilSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatProfissionalPerfilValidationError(parsed.error) })
    }

    try {
      const profile = await patchProfissionalPerfil(ctx(request), parsed.data)
      return reply.send(profile)
    } catch (error) {
      const mapped = mapProfissionalPerfilError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.put('/foto', { preHandler: canEdit }, async (request, reply) => {
    const parsed = uploadFotoSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      return reply.status(400).send({ error: formatProfissionalPerfilValidationError(parsed.error) })
    }

    try {
      const result = await updateProfissionalFoto(ctx(request).profissionalId, parsed.data.fotoDataUrl)
      return reply.send(result)
    } catch (error) {
      const mapped = mapProfissionalPerfilError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/documentos', { preHandler: canView }, async (request, reply) => {
    try {
      const documentos = await listProfissionalPerfilDocumentos(ctx(request))
      reply.header('Cache-Control', 'private, max-age=30')
      return reply.send({ documentos })
    } catch (error) {
      const mapped = mapProfissionalPerfilError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.get('/documentos/:documentoId/preview', { preHandler: canView }, async (request, reply) => {
    const documentoId = (request.params as { documentoId?: string }).documentoId
    if (!documentoId) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    try {
      const preview = await getProfissionalDocumentoPreviewUrl(ctx(request), documentoId)
      reply.header('Cache-Control', 'private, max-age=300')
      return reply.send(preview)
    } catch (error) {
      const mapped = mapProfissionalPerfilError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/documentos/:documentoId', { preHandler: canEdit }, async (request, reply) => {
    const documentoId = (request.params as { documentoId?: string }).documentoId
    if (!documentoId) {
      return reply.status(400).send({ error: 'Identificador inválido.' })
    }

    try {
      let fileBuffer: Buffer | null = null
      let mimeType = 'application/octet-stream'
      let fileName = 'documento'

      for await (const part of request.parts()) {
        if (part.type !== 'file' || part.fieldname !== 'file') continue
        fileBuffer = await part.toBuffer()
        mimeType = part.mimetype
        fileName = part.filename
        if (fileBuffer.length > MAX_DOCUMENT_BYTES) {
          throw new ProfissionalPerfilError('Arquivo excede 8 MB.', 'INVALID_DATA', 400)
        }
      }

      if (!fileBuffer) {
        throw new ProfissionalPerfilError('Envie o arquivo do documento.', 'INVALID_DATA', 400)
      }

      const documento = await replaceProfissionalDocumento(ctx(request), documentoId, {
        buffer: fileBuffer,
        mimeType,
        fileName,
      })

      return reply.status(201).send({ documento })
    } catch (error) {
      const mapped = mapProfissionalPerfilError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/certificado/conselho', { preHandler: canEdit }, async (request, reply) => {
    try {
      const result = await vincularCertificadoConselho(ctx(request))
      return reply.send(result)
    } catch (error) {
      const mapped = mapProfissionalPerfilError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })

  app.post('/certificado/a1', { preHandler: canEdit }, async (request, reply) => {
    try {
      let fileBuffer: Buffer | null = null
      let fileName = 'certificado.pfx'
      let password = ''

      for await (const part of request.parts()) {
        if (part.type === 'field') {
          if (part.fieldname === 'password') password = String(part.value)
          continue
        }
        if (part.fieldname === 'file') {
          fileBuffer = await part.toBuffer()
          fileName = part.filename
          if (fileBuffer.length > MAX_CERT_BYTES) {
            throw new ProfissionalPerfilError('Certificado excede 5 MB.', 'INVALID_DATA', 400)
          }
        }
      }

      if (!fileBuffer) {
        throw new ProfissionalPerfilError('Envie o arquivo do certificado.', 'INVALID_DATA', 400)
      }

      const result = await uploadCertificadoA1(ctx(request), {
        buffer: fileBuffer,
        fileName,
        password,
      })
      return reply.send(result)
    } catch (error) {
      const mapped = mapProfissionalPerfilError(error)
      return reply.status(mapped.statusCode).send(mapped.body)
    }
  })
}
