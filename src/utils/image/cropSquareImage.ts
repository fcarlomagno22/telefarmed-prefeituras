export type SquareCropParams = {
  zoom: number
  panX: number
  panY: number
}

export const SQUARE_CROP_VIEWPORT_PX = 240
export const SQUARE_CROP_OUTPUT_PX = 512

export function clampSquareCropPan(
  imageWidth: number,
  imageHeight: number,
  zoom: number,
  panX: number,
  panY: number,
  viewport = SQUARE_CROP_VIEWPORT_PX,
): SquareCropParams {
  const baseScale = Math.max(viewport / imageWidth, viewport / imageHeight)
  const scale = baseScale * zoom
  const displayW = imageWidth * scale
  const displayH = imageHeight * scale

  const minPanX = Math.min(0, viewport - displayW)
  const maxPanX = Math.max(0, viewport - displayW)
  const minPanY = Math.min(0, viewport - displayH)
  const maxPanY = Math.max(0, viewport - displayH)

  return {
    zoom,
    panX: Math.min(maxPanX, Math.max(minPanX, panX)),
    panY: Math.min(maxPanY, Math.max(minPanY, panY)),
  }
}

export function cropSquareImageToDataUrl(
  image: HTMLImageElement,
  params: SquareCropParams,
  outputSize = SQUARE_CROP_OUTPUT_PX,
  viewport = SQUARE_CROP_VIEWPORT_PX,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92,
): string {
  const baseScale = Math.max(viewport / image.naturalWidth, viewport / image.naturalHeight)
  const scale = baseScale * params.zoom
  const displayW = image.naturalWidth * scale
  const displayH = image.naturalHeight * scale
  const drawX = (viewport - displayW) / 2 + params.panX
  const drawY = (viewport - displayH) / 2 + params.panY

  const srcX = Math.max(0, -drawX / scale)
  const srcY = Math.max(0, -drawY / scale)
  const srcSize = viewport / scale

  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.drawImage(image, srcX, srcY, srcSize, srcSize, 0, 0, outputSize, outputSize)
  return canvas.toDataURL(mimeType, quality)
}

export async function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Não foi possível carregar a imagem.'))
    image.src = dataUrl
  })
}

export async function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Arquivo inválido.'))
    }
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'))
    reader.readAsDataURL(file)
  })
}
