import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '../../db/supabase.js'
import {
  ALLOWED_SUPORTE_MIME_TYPES,
  MAX_SUPORTE_ANEXO_BYTES,
  SUPORTE_ANEXOS_BUCKET,
} from './constants.js'
import { mimeToAnexoTipo, sanitizeFileName } from './formatters.js'
import { SuporteError } from './errors.js'
import type { ParsedSuporteFile } from './types.js'

const SIGNED_URL_TTL_SECONDS = 60 * 60

export async function createAnexoSignedUrls(storagePaths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (!storagePaths.length) return map

  const uniquePaths = [...new Set(storagePaths)]
  await Promise.all(
    uniquePaths.map(async (path) => {
      const { data, error } = await supabaseAdmin.storage
        .from(SUPORTE_ANEXOS_BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

      if (error || !data?.signedUrl) return
      map.set(path, data.signedUrl)
    }),
  )

  return map
}

export async function uploadSuporteAnexos(
  chamadoId: string,
  mensagemId: string,
  files: ParsedSuporteFile[],
): Promise<
  Array<{
    id: string
    nome_arquivo: string
    tipo: 'pdf' | 'image'
    mime_type: string
    tamanho_bytes: number
    storage_path: string
  }>
> {
  if (!files.length) return []

  const uploaded: Array<{
    id: string
    nome_arquivo: string
    tipo: 'pdf' | 'image'
    mime_type: string
    tamanho_bytes: number
    storage_path: string
  }> = []

  for (const file of files) {
    if (file.buffer.length === 0) {
      throw new SuporteError('Arquivo vazio.', 'INVALID_FILE', 400)
    }
    if (file.buffer.length > MAX_SUPORTE_ANEXO_BYTES) {
      throw new SuporteError('Arquivo excede 10 MB.', 'FILE_TOO_LARGE', 400)
    }
    if (!ALLOWED_SUPORTE_MIME_TYPES.has(file.mimeType)) {
      throw new SuporteError('Tipo de arquivo não permitido.', 'INVALID_FILE_TYPE', 400)
    }

    const safeName = sanitizeFileName(file.fileName)
    const storagePath = `${chamadoId}/${mensagemId}/${randomUUID()}-${safeName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(SUPORTE_ANEXOS_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimeType,
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data, error } = await supabaseAdmin
      .from('anexos_mensagem_chamado')
      .insert({
        chamado_id: chamadoId,
        mensagem_id: mensagemId,
        nome_arquivo: safeName,
        tipo: mimeToAnexoTipo(file.mimeType),
        mime_type: file.mimeType,
        tamanho_bytes: file.buffer.length,
        storage_path: storagePath,
      })
      .select('id, nome_arquivo, tipo, mime_type, tamanho_bytes, storage_path')
      .single()

    if (error) {
      await supabaseAdmin.storage.from(SUPORTE_ANEXOS_BUCKET).remove([storagePath])
      throw error
    }

    uploaded.push({
      id: String(data.id),
      nome_arquivo: String(data.nome_arquivo),
      tipo: data.tipo as 'pdf' | 'image',
      mime_type: String(data.mime_type),
      tamanho_bytes: Number(data.tamanho_bytes),
      storage_path: String(data.storage_path),
    })
  }

  return uploaded
}
