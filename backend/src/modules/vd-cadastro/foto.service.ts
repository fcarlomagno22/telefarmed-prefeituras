import { supabaseAdmin } from '../../db/supabase.js'
import {
  resolvePacienteFotoPublicUrl,
  resolvePacienteFotoStoragePath,
  toStoredPacienteFotoReference,
} from '../../lib/pacienteFoto.js'
import { VdCadastroError } from './errors.js'

const FOTOS_BUCKET = 'pacientes-fotos'
const DATA_URL_REGEX = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i

function parsePhotoDataUrl(dataUrl: string): { buffer: Buffer; mime: string; extension: string } {
  const match = DATA_URL_REGEX.exec(dataUrl.trim())
  if (!match) {
    throw new VdCadastroError('Formato de foto inválido.', 'INVALID_DATA', 400)
  }

  const mime = match[1].toLowerCase()
  const buffer = Buffer.from(match[2], 'base64')

  if (buffer.length === 0) {
    throw new VdCadastroError('Arquivo de foto vazio.', 'INVALID_DATA', 400)
  }

  if (buffer.length > 5 * 1024 * 1024) {
    throw new VdCadastroError('Foto excede o limite de 5 MB.', 'INVALID_DATA', 400)
  }

  const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
  return { buffer, mime, extension }
}

function toStoragePath(pacienteId: string, extension: string): string {
  return `${pacienteId}/avatar.${extension}`
}

export async function uploadVdPacienteFoto(
  pacienteId: string,
  photoDataUrl: string,
): Promise<string> {
  const photo = parsePhotoDataUrl(photoDataUrl)
  const storagePath = toStoragePath(pacienteId, photo.extension)

  const { data: currentRow, error: currentError } = await supabaseAdmin
    .from('pacientes')
    .select('foto_url')
    .eq('id', pacienteId)
    .maybeSingle()

  if (currentError) throw currentError

  const previousPath = resolvePacienteFotoStoragePath(
    currentRow?.foto_url ? String(currentRow.foto_url) : null,
  )

  const { error: uploadError } = await supabaseAdmin.storage
    .from(FOTOS_BUCKET)
    .upload(storagePath, photo.buffer, {
      contentType: photo.mime,
      upsert: true,
    })

  if (uploadError) {
    throw new VdCadastroError('Não foi possível enviar a foto.', 'INVALID_DATA', 500)
  }

  const storedReference = toStoredPacienteFotoReference(storagePath)
  const { error: updateError } = await supabaseAdmin
    .from('pacientes')
    .update({ foto_url: storedReference })
    .eq('id', pacienteId)

  if (updateError) {
    await supabaseAdmin.storage.from(FOTOS_BUCKET).remove([storagePath])
    throw updateError
  }

  if (previousPath && previousPath !== storagePath) {
    await supabaseAdmin.storage.from(FOTOS_BUCKET).remove([previousPath])
  }

  return storedReference
}

/** Upload + URL pública assinada (perfil autenticado no app VD). */
export async function updateVdPacienteFoto(
  pacienteId: string,
  photoDataUrl: string,
): Promise<{ avatarUrl: string }> {
  const storedReference = await uploadVdPacienteFoto(pacienteId, photoDataUrl)
  const avatarUrl = await resolvePacienteFotoPublicUrl(storedReference)
  if (!avatarUrl) {
    throw new VdCadastroError('Não foi possível gerar URL da foto.', 'INVALID_DATA', 500)
  }
  return { avatarUrl }
}

/** Remove foto do storage e limpa `pacientes.foto_url`. */
export async function deleteVdPacienteFoto(pacienteId: string): Promise<void> {
  const { data: currentRow, error: currentError } = await supabaseAdmin
    .from('pacientes')
    .select('foto_url')
    .eq('id', pacienteId)
    .maybeSingle()

  if (currentError) throw currentError
  if (!currentRow) {
    throw new VdCadastroError('Paciente não encontrado.', 'NOT_FOUND', 404)
  }

  const previousPath = resolvePacienteFotoStoragePath(
    currentRow.foto_url ? String(currentRow.foto_url) : null,
  )

  const { error: updateError } = await supabaseAdmin
    .from('pacientes')
    .update({ foto_url: null })
    .eq('id', pacienteId)

  if (updateError) throw updateError

  if (previousPath) {
    await supabaseAdmin.storage.from(FOTOS_BUCKET).remove([previousPath])
  }
}

export function isPacientePhotoDataUrl(value: string | undefined): boolean {
  if (!value?.trim()) return false
  return DATA_URL_REGEX.test(value.trim())
}
