import { supabaseAdmin } from '../../db/supabase.js'

export const LOGIN_BACKGROUND_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24

const DATA_URL_REGEX = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i

type ParsedLoginBackground = {
  buffer: Buffer
  mime: string
  extension: 'png' | 'jpg' | 'webp'
}

function parseLoginBackgroundDataUrl(dataUrl: string): ParsedLoginBackground {
  const match = DATA_URL_REGEX.exec(dataUrl.trim())
  if (!match) {
    throw new Error('Formato de imagem de fundo inválido.')
  }

  const mime = match[1].toLowerCase()
  const buffer = Buffer.from(match[2], 'base64')

  if (buffer.length === 0) {
    throw new Error('Arquivo de fundo vazio.')
  }

  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Imagem de fundo excede o limite de 5 MB.')
  }

  const extension: ParsedLoginBackground['extension'] =
    mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'

  return { buffer, mime, extension }
}

export async function uploadEntidadeLoginBackground(
  entidadeId: string,
  backgroundDataUrl: string,
): Promise<string> {
  const parsed = parseLoginBackgroundDataUrl(backgroundDataUrl)
  const storagePath = `${entidadeId}/login-background.${parsed.extension}`

  const { error } = await supabaseAdmin.storage
    .from('entidades-logos')
    .upload(storagePath, parsed.buffer, {
      contentType: parsed.mime,
      upsert: true,
    })

  if (error) throw error

  const { error: updateError } = await supabaseAdmin
    .from('entidades_contratantes')
    .update({ login_background_storage_path: storagePath })
    .eq('id', entidadeId)

  if (updateError) throw updateError

  return storagePath
}

export async function createSignedLoginBackgroundUrl(
  storagePath: string | null | undefined,
): Promise<string | null> {
  if (!storagePath) return null

  const { data, error } = await supabaseAdmin.storage
    .from('entidades-logos')
    .createSignedUrl(storagePath, LOGIN_BACKGROUND_SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export async function resolveLoginBackgroundUrlsByEntityId(
  rows: Array<{ id: string; login_background_storage_path: string | null }>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const targets = rows.filter((row) => row.login_background_storage_path)

  await Promise.all(
    targets.map(async (row) => {
      const signedUrl = await createSignedLoginBackgroundUrl(row.login_background_storage_path)
      if (signedUrl) {
        map.set(row.id, signedUrl)
      }
    }),
  )

  return map
}

export async function deleteEntidadeLoginBackground(storagePath: string | null): Promise<void> {
  if (!storagePath) return

  const { error } = await supabaseAdmin.storage.from('entidades-logos').remove([storagePath])
  if (error) throw error
}
