import { supabaseAdmin } from '../../db/supabase.js'
import { createProfissionalFotoSignedUrl } from '../admin-profissionais/documentos.service.js'
import { ProfissionalPerfilError } from './errors.js'

const FOTOS_BUCKET = 'profissionais-fotos'
const DATA_URL_REGEX = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i

function parseSelfieDataUrl(dataUrl: string): { buffer: Buffer; mime: string; extension: string } {
  const match = DATA_URL_REGEX.exec(dataUrl.trim())
  if (!match) {
    throw new ProfissionalPerfilError('Formato de foto inválido.', 'INVALID_DATA', 400)
  }

  const mime = match[1].toLowerCase()
  const buffer = Buffer.from(match[2], 'base64')

  if (buffer.length === 0) {
    throw new ProfissionalPerfilError('Arquivo de foto vazio.', 'INVALID_DATA', 400)
  }

  if (buffer.length > 5 * 1024 * 1024) {
    throw new ProfissionalPerfilError('Foto excede o limite de 5 MB.', 'INVALID_DATA', 400)
  }

  const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
  return { buffer, mime, extension }
}

export async function updateProfissionalFoto(
  profissionalId: string,
  fotoDataUrl: string,
): Promise<{ avatarUrl: string }> {
  const selfie = parseSelfieDataUrl(fotoDataUrl)
  const fotoStoragePath = `${profissionalId}/avatar.${selfie.extension}`

  const { data: current, error: currentError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('foto_storage_path')
    .eq('id', profissionalId)
    .maybeSingle()

  if (currentError) throw currentError
  if (!current) {
    throw new ProfissionalPerfilError('Profissional não encontrado.', 'NOT_FOUND', 404)
  }

  const oldPath = current.foto_storage_path ? String(current.foto_storage_path) : null

  const { error: uploadError } = await supabaseAdmin.storage
    .from(FOTOS_BUCKET)
    .upload(fotoStoragePath, selfie.buffer, {
      contentType: selfie.mime,
      upsert: true,
    })

  if (uploadError) throw uploadError

  const { error: updateError } = await supabaseAdmin
    .from('usuarios_profissionais')
    .update({ foto_storage_path: fotoStoragePath })
    .eq('id', profissionalId)

  if (updateError) {
    await supabaseAdmin.storage.from(FOTOS_BUCKET).remove([fotoStoragePath])
    throw updateError
  }

  if (oldPath && oldPath !== fotoStoragePath) {
    await supabaseAdmin.storage.from(FOTOS_BUCKET).remove([oldPath])
  }

  const avatarUrl = await createProfissionalFotoSignedUrl(fotoStoragePath)
  if (!avatarUrl) {
    throw new ProfissionalPerfilError('Não foi possível gerar URL da foto.', 'UPLOAD_FAILED', 500)
  }

  return { avatarUrl }
}
