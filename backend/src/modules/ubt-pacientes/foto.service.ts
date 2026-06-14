import { supabaseAdmin } from '../../db/supabase.js'
import {
  createPacienteFotoSignedUrl,
  resolvePacienteFotoStoragePath,
  toStoredPacienteFotoReference,
} from '../../lib/pacienteFoto.js'
import { getPacienteDetail } from '../admin-pacientes/pacientes.service.js'
import { assertPacienteBelongsToEntity } from './ownership.js'
import { UbtPacientesError } from './errors.js'
import { mapAdminPatientToUbtPatient } from './formatters.js'
import type { UbtScope, UbtPacienteDto } from './types.js'

const FOTOS_BUCKET = 'pacientes-fotos'
const DATA_URL_REGEX = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i

function parsePhotoDataUrl(dataUrl: string): { buffer: Buffer; mime: string; extension: string } {
  const match = DATA_URL_REGEX.exec(dataUrl.trim())
  if (!match) {
    throw new UbtPacientesError('Formato de foto inválido.', 'INVALID_DATA', 400)
  }

  const mime = match[1].toLowerCase()
  const buffer = Buffer.from(match[2], 'base64')

  if (buffer.length === 0) {
    throw new UbtPacientesError('Arquivo de foto vazio.', 'INVALID_DATA', 400)
  }

  if (buffer.length > 5 * 1024 * 1024) {
    throw new UbtPacientesError('Foto excede o limite de 5 MB.', 'INVALID_DATA', 400)
  }

  const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
  return { buffer, mime, extension }
}

function toStoragePath(pacienteId: string, extension: string): string {
  return `${pacienteId}/avatar.${extension}`
}

export async function uploadUbtPacienteFoto(
  scope: UbtScope,
  pacienteId: string,
  photoDataUrl: string,
): Promise<UbtPacienteDto> {
  await assertPacienteBelongsToEntity(scope.entidadeContratanteId, pacienteId)

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
    throw new UbtPacientesError('Não foi possível enviar a foto.', 'INVALID_DATA', 500)
  }

  const { error: updateError } = await supabaseAdmin
    .from('pacientes')
    .update({ foto_url: toStoredPacienteFotoReference(storagePath) })
    .eq('id', pacienteId)

  if (updateError) {
    await supabaseAdmin.storage.from(FOTOS_BUCKET).remove([storagePath])
    throw updateError
  }

  if (previousPath && previousPath !== storagePath) {
    await supabaseAdmin.storage.from(FOTOS_BUCKET).remove([previousPath])
  }

  const detail = await getPacienteDetail(pacienteId)
  return mapAdminPatientToUbtPatient(detail)
}

export { createPacienteFotoSignedUrl, resolvePacienteFotoStoragePath }
