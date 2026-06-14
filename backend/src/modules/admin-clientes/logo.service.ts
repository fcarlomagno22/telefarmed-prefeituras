import { supabaseAdmin } from '../../db/supabase.js'
import { ClientesError } from './errors.js'

const LOGO_BUCKET = 'entidades-logos'
const LOGO_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24

const DATA_URL_REGEX = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i

type ParsedLogo = {
  buffer: Buffer
  mime: string
  extension: 'png' | 'jpg' | 'webp'
}

function parseLogoDataUrl(dataUrl: string): ParsedLogo {
  const match = DATA_URL_REGEX.exec(dataUrl.trim())
  if (!match) {
    throw new ClientesError('Formato de logo inválido.', 'INVALID_DATA', 400)
  }

  const mime = match[1].toLowerCase()
  const buffer = Buffer.from(match[2], 'base64')

  if (buffer.length === 0) {
    throw new ClientesError('Arquivo de logo vazio.', 'INVALID_DATA', 400)
  }

  if (buffer.length > 5 * 1024 * 1024) {
    throw new ClientesError('Logo excede o limite de 5 MB.', 'INVALID_DATA', 400)
  }

  const extension: ParsedLogo['extension'] =
    mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'

  return { buffer, mime, extension }
}

export async function uploadEntidadeLogo(
  entidadeId: string,
  logoDataUrl: string,
): Promise<string> {
  const parsed = parseLogoDataUrl(logoDataUrl)
  const storagePath = `${entidadeId}/logo.${parsed.extension}`

  const { error } = await supabaseAdmin.storage.from(LOGO_BUCKET).upload(storagePath, parsed.buffer, {
    contentType: parsed.mime,
    upsert: true,
  })

  if (error) throw error

  const { error: updateError } = await supabaseAdmin
    .from('entidades_contratantes')
    .update({ logo_storage_path: storagePath })
    .eq('id', entidadeId)

  if (updateError) throw updateError

  return storagePath
}

export async function resolveLogoUrlsByEntityId(
  rows: Array<{ id: string; logo_storage_path: string | null }>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const targets = rows.filter((row) => row.logo_storage_path)

  await Promise.all(
    targets.map(async (row) => {
      const { data, error } = await supabaseAdmin.storage
        .from(LOGO_BUCKET)
        .createSignedUrl(row.logo_storage_path!, LOGO_SIGNED_URL_TTL_SECONDS)

      if (error || !data?.signedUrl) return
      map.set(row.id, data.signedUrl)
    }),
  )

  return map
}

export async function deleteEntidadeLogo(storagePath: string | null): Promise<void> {
  if (!storagePath) return

  const { error } = await supabaseAdmin.storage.from(LOGO_BUCKET).remove([storagePath])
  if (error) throw error
}
