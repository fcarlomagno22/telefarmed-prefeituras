import { supabaseAdmin } from '../../db/supabase.js'

const CANDIDATURAS_BUCKET = 'candidaturas-documentos'
const FOTOS_BUCKET = 'profissionais-fotos'
const SIGNED_URL_TTL_SECONDS = 60 * 60

export async function createCandidaturaDocumentSignedUrl(
  storagePath: string,
): Promise<string | undefined> {
  const { data, error } = await supabaseAdmin.storage
    .from(CANDIDATURAS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) return undefined
  return data.signedUrl
}

export async function createProfissionalFotoSignedUrl(
  storagePath: string | null | undefined,
): Promise<string | undefined> {
  if (!storagePath) return undefined

  const { data, error } = await supabaseAdmin.storage
    .from(FOTOS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) return undefined
  return data.signedUrl
}
