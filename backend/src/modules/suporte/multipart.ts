import type { FastifyRequest } from 'fastify'
import {
  ALLOWED_SUPORTE_MIME_TYPES,
  MAX_SUPORTE_ANEXO_BYTES,
  MAX_SUPORTE_ANEXOS_PER_MESSAGE,
} from './constants.js'
import { SuporteError } from './errors.js'
import type { ParsedSuporteFile, ParsedSuporteMultipart } from './types.js'

export async function parseSuporteMultipart(request: FastifyRequest): Promise<ParsedSuporteMultipart> {
  const fields: Record<string, string> = {}
  const files: ParsedSuporteFile[] = []

  for await (const part of request.parts()) {
    if (part.type === 'field') {
      fields[part.fieldname] = String(part.value)
      continue
    }

    if (part.fieldname !== 'files' && part.fieldname !== 'file') {
      continue
    }

    const buffer = await part.toBuffer()
    if (buffer.length === 0) continue

    if (buffer.length > MAX_SUPORTE_ANEXO_BYTES) {
      throw new SuporteError('Arquivo excede 10 MB.', 'FILE_TOO_LARGE', 400)
    }

    if (!ALLOWED_SUPORTE_MIME_TYPES.has(part.mimetype)) {
      throw new SuporteError('Tipo de arquivo não permitido.', 'INVALID_FILE_TYPE', 400)
    }

    files.push({
      buffer,
      mimeType: part.mimetype,
      fileName: part.filename || 'anexo',
    })
  }

  if (files.length > MAX_SUPORTE_ANEXOS_PER_MESSAGE) {
    throw new SuporteError(
      `Máximo de ${MAX_SUPORTE_ANEXOS_PER_MESSAGE} anexos por mensagem.`,
      'TOO_MANY_FILES',
      400,
    )
  }

  return { fields, files }
}
