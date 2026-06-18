import { supabaseAdmin } from '../../db/supabase.js'

export const FAVICON_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24

const DATA_URL_REGEX = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i

type ParsedFavicon = {
  buffer: Buffer
  mime: string
  extension: 'png' | 'jpg' | 'webp'
}

function parseFaviconDataUrl(dataUrl: string): ParsedFavicon {
  const match = DATA_URL_REGEX.exec(dataUrl.trim())
  if (!match) {
    throw new Error('Formato de favicon inválido. Use PNG, JPEG ou WebP.')
  }

  const mime = match[1].toLowerCase()
  const buffer = Buffer.from(match[2], 'base64')

  if (buffer.length === 0) {
    throw new Error('Arquivo de favicon vazio.')
  }

  if (buffer.length > 512 * 1024) {
    throw new Error('Favicon excede o limite de 512 KB.')
  }

  const extension: ParsedFavicon['extension'] =
    mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'

  return { buffer, mime, extension }
}

export async function uploadEntidadeFavicon(
  entidadeId: string,
  faviconDataUrl: string,
): Promise<string> {
  const parsed = parseFaviconDataUrl(faviconDataUrl)
  const storagePath = `${entidadeId}/favicon.${parsed.extension}`

  const { error } = await supabaseAdmin.storage
    .from('entidades-logos')
    .upload(storagePath, parsed.buffer, {
      contentType: parsed.mime,
      upsert: true,
    })

  if (error) throw error

  const { error: updateError } = await supabaseAdmin
    .from('entidades_contratantes')
    .update({ favicon_storage_path: storagePath })
    .eq('id', entidadeId)

  if (updateError) throw updateError

  return storagePath
}

export async function createSignedFaviconUrl(
  storagePath: string | null | undefined,
): Promise<string | null> {
  if (!storagePath) return null

  const { data, error } = await supabaseAdmin.storage
    .from('entidades-logos')
    .createSignedUrl(storagePath, FAVICON_SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export async function resolveFaviconUrlsByEntityId(
  rows: Array<{ id: string; favicon_storage_path: string | null }>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const targets = rows.filter((row) => row.favicon_storage_path)

  await Promise.all(
    targets.map(async (row) => {
      const signedUrl = await createSignedFaviconUrl(row.favicon_storage_path)
      if (signedUrl) {
        map.set(row.id, signedUrl)
      }
    }),
  )

  return map
}

export async function deleteEntidadeFavicon(storagePath: string | null): Promise<void> {
  if (!storagePath) return

  const { error } = await supabaseAdmin.storage.from('entidades-logos').remove([storagePath])
  if (error) throw error
}
