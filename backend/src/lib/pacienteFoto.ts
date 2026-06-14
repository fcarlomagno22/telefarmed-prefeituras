import { supabaseAdmin } from '../db/supabase.js'

const FOTOS_BUCKET = 'pacientes-fotos'
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7
const STORAGE_PATH_PREFIX = 'sb://'

export function resolvePacienteFotoStoragePath(
  fotoUrl: string | null | undefined,
): string | null {
  if (!fotoUrl?.trim()) return null
  const trimmed = fotoUrl.trim()
  if (!trimmed.startsWith(STORAGE_PATH_PREFIX)) return null
  const withoutPrefix = trimmed.slice(STORAGE_PATH_PREFIX.length)
  const slashIndex = withoutPrefix.indexOf('/')
  if (slashIndex <= 0) return null
  const bucket = withoutPrefix.slice(0, slashIndex)
  if (bucket !== FOTOS_BUCKET) return null
  return withoutPrefix.slice(slashIndex + 1)
}

export function toStoredPacienteFotoReference(storagePath: string): string {
  return `${STORAGE_PATH_PREFIX}${FOTOS_BUCKET}/${storagePath}`
}

export async function createPacienteFotoSignedUrl(
  storagePath: string | null | undefined,
): Promise<string | undefined> {
  if (!storagePath) return undefined

  const { data, error } = await supabaseAdmin.storage
    .from(FOTOS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) return undefined
  return data.signedUrl
}

export async function resolvePacienteFotoPublicUrl(
  fotoUrl: string | null | undefined,
): Promise<string | undefined> {
  if (!fotoUrl?.trim()) return undefined
  const trimmed = fotoUrl.trim()
  const storagePath = resolvePacienteFotoStoragePath(trimmed)
  if (storagePath) {
    return createPacienteFotoSignedUrl(storagePath)
  }
  return trimmed
}

export function isStoredPacienteFotoReference(fotoUrl: string | null | undefined): boolean {
  return Boolean(fotoUrl?.trim().startsWith(STORAGE_PATH_PREFIX))
}

export async function resolvePacienteFotoPublicUrlsBatch(
  fotoUrls: Iterable<string | null | undefined>,
): Promise<Map<string, string | undefined>> {
  const unique = [
    ...new Set(
      [...fotoUrls]
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ]

  const resolved = new Map<string, string | undefined>()
  await Promise.all(
    unique.map(async (ref) => {
      resolved.set(ref, await resolvePacienteFotoPublicUrl(ref))
    }),
  )

  return resolved
}

export async function hydratePatientAvatarUrls<T extends { avatarUrl?: string }>(
  sources: Array<{ foto_url: string | null }>,
  patients: T[],
): Promise<T[]> {
  const resolvedByRef = await resolvePacienteFotoPublicUrlsBatch(
    sources.map((row) => row.foto_url),
  )

  return patients.map((patient, index) => {
    const ref = sources[index]?.foto_url?.trim()
    if (!ref) return patient

    const resolved = resolvedByRef.get(ref)
    if (resolved) {
      return { ...patient, avatarUrl: resolved }
    }

    if (isStoredPacienteFotoReference(ref)) {
      return { ...patient, avatarUrl: undefined }
    }

    return patient
  })
}
