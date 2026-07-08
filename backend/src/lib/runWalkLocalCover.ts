import { randomUUID } from 'node:crypto'
import { supabaseAdmin } from '../db/supabase.js'
import { VdRunWalkError } from '../modules/vd-run-walk/errors.js'

export const RUN_WALK_LOCAIS_CAPAS_BUCKET = 'run-walk-locais-capas'
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7
const STORAGE_PATH_PREFIX = 'sb://'

export function toStoredRunWalkLocalCoverReference(storagePath: string): string {
  return `${STORAGE_PATH_PREFIX}${RUN_WALK_LOCAIS_CAPAS_BUCKET}/${storagePath}`
}

export function resolveRunWalkLocalCoverStoragePath(
  coverPhotoUrl: string | null | undefined,
): string | null {
  if (!coverPhotoUrl?.trim()) return null
  const trimmed = coverPhotoUrl.trim()
  if (!trimmed.startsWith(STORAGE_PATH_PREFIX)) return null

  const withoutPrefix = trimmed.slice(STORAGE_PATH_PREFIX.length)
  const slashIndex = withoutPrefix.indexOf('/')
  if (slashIndex <= 0) return null

  const bucket = withoutPrefix.slice(0, slashIndex)
  if (bucket !== RUN_WALK_LOCAIS_CAPAS_BUCKET) return null

  return withoutPrefix.slice(slashIndex + 1)
}

export async function createRunWalkLocalCoverSignedUrl(
  storagePath: string | null | undefined,
): Promise<string | undefined> {
  if (!storagePath?.trim()) return undefined

  const { data, error } = await supabaseAdmin.storage
    .from(RUN_WALK_LOCAIS_CAPAS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) return undefined
  return data.signedUrl
}

export async function resolveRunWalkLocalCoverPublicUrl(
  coverPhotoUrl: string | null | undefined,
): Promise<string | null> {
  if (!coverPhotoUrl?.trim()) return null

  const trimmed = coverPhotoUrl.trim()
  const storagePath = resolveRunWalkLocalCoverStoragePath(trimmed)
  if (storagePath) {
    const signed = await createRunWalkLocalCoverSignedUrl(storagePath)
    return signed ?? null
  }

  return trimmed
}

export function buildRunWalkLocalCoverStoragePath(
  entidadeContratanteId: string,
  pacienteId: string,
): string {
  return `${entidadeContratanteId}/${pacienteId}/${randomUUID()}.jpg`
}

export async function createRunWalkLocalCoverUploadUrl(storagePath: string): Promise<{
  signedUrl: string
  storagePath: string
  token: string
  coverPhotoReference: string
}> {
  const { data, error } = await supabaseAdmin.storage
    .from(RUN_WALK_LOCAIS_CAPAS_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: true })

  if (error || !data?.signedUrl || !data.token) {
    const detail = error?.message?.trim()
    throw new VdRunWalkError(
      detail
        ? `Não foi possível preparar o envio da foto do local: ${detail}`
        : 'Não foi possível preparar o envio da foto do local. Verifique o bucket de storage.',
      'STORAGE_UNAVAILABLE',
      503,
    )
  }

  return {
    signedUrl: data.signedUrl,
    storagePath,
    token: data.token,
    coverPhotoReference: toStoredRunWalkLocalCoverReference(storagePath),
  }
}
