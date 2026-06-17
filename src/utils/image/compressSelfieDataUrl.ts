import { loadImageFromDataUrl } from './cropSquareImage'

export const SELFIE_MAX_SIDE_PX = 512
export const SELFIE_JPEG_QUALITY = 0.82
/** Limite conservador para caber no body JSON (base64 ~33% maior que o binário). */
const SELFIE_MAX_ENCODED_BYTES = 900 * 1024

function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  return Math.ceil((base64.length * 3) / 4)
}

export async function compressSelfieDataUrl(dataUrl: string): Promise<string> {
  const trimmed = dataUrl.trim()
  if (!trimmed) return trimmed

  const image = await loadImageFromDataUrl(trimmed)
  const maxSide = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = maxSide > SELFIE_MAX_SIDE_PX ? SELFIE_MAX_SIDE_PX / maxSide : 1
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return trimmed

  ctx.drawImage(image, 0, 0, width, height)

  let quality = SELFIE_JPEG_QUALITY
  let result = canvas.toDataURL('image/jpeg', quality)

  while (estimateDataUrlBytes(result) > SELFIE_MAX_ENCODED_BYTES && quality > 0.5) {
    quality -= 0.08
    result = canvas.toDataURL('image/jpeg', quality)
  }

  return result
}
