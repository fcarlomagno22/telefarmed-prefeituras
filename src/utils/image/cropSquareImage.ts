export type SquareCropParams = {
  zoom: number
  panX: number
  panY: number
}

export const SQUARE_CROP_VIEWPORT_PX = 280
export const SQUARE_CROP_OUTPUT_PX = 512

export type LogoCropFormat = 'square' | 'landscape' | 'portrait'

export type DetectedImageFormat = {
  width: number
  height: number
  aspectRatio: number
  orientation: LogoCropFormat
  aspectLabel: string
  orientationLabel: string
  /** Ex.: Horizontal · 840 × 260 px · 3.2:1 */
  summary: string
}

export type LogoCropViewport = {
  viewportWidth: number
  viewportHeight: number
  format: LogoCropFormat
  formatLabel: string
  detected: DetectedImageFormat
}

export type CropZoomBounds = {
  coverScale: number
  containScale: number
  minZoom: number
  maxZoom: number
  defaultZoom: number
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a))
  let y = Math.abs(Math.round(b))
  while (y) {
    const temp = y
    y = x % y
    x = temp
  }
  return x || 1
}

export function formatLogoAspectLabel(imageWidth: number, imageHeight: number): string {
  const g = gcd(imageWidth, imageHeight)
  const reducedW = Math.round(imageWidth / g)
  const reducedH = Math.round(imageHeight / g)

  if (reducedW <= 24 && reducedH <= 24) {
    return `${reducedW}:${reducedH}`
  }

  const ratio = imageWidth / imageHeight
  if (ratio >= 1) {
    return `${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}:1`
  }
  const inverse = imageHeight / imageWidth
  return `1:${inverse >= 10 ? Math.round(inverse) : inverse.toFixed(1)}`
}

function resolveOrientation(ratio: number): LogoCropFormat {
  if (ratio >= 0.92 && ratio <= 1.08) return 'square'
  if (ratio > 1) return 'landscape'
  return 'portrait'
}

function orientationLabel(orientation: LogoCropFormat): string {
  if (orientation === 'square') return 'Quadrado'
  if (orientation === 'landscape') return 'Horizontal'
  return 'Vertical'
}

export function detectImageFormat(imageWidth: number, imageHeight: number): DetectedImageFormat {
  const width = Math.max(1, Math.round(imageWidth))
  const height = Math.max(1, Math.round(imageHeight))
  const aspectRatio = width / height
  const orientation = resolveOrientation(aspectRatio)
  const aspectLabel = formatLogoAspectLabel(width, height)
  const orient = orientationLabel(orientation)

  return {
    width,
    height,
    aspectRatio,
    orientation,
    aspectLabel,
    orientationLabel: orient,
    summary: `${orient} · ${width.toLocaleString('pt-BR')} × ${height.toLocaleString('pt-BR')} px · ${aspectLabel}`,
  }
}

function viewportFromAspect(
  aspectRatio: number,
  maxLongEdge: number,
  detected: DetectedImageFormat,
): Pick<LogoCropViewport, 'viewportWidth' | 'viewportHeight' | 'format' | 'formatLabel'> {
  const minShortEdge = Math.max(64, Math.round(maxLongEdge * 0.38))

  if (aspectRatio >= 1) {
    const viewportWidth = maxLongEdge
    const viewportHeight = Math.max(minShortEdge, Math.round(maxLongEdge / aspectRatio))
    return {
      viewportWidth,
      viewportHeight,
      format: detected.orientation,
      formatLabel: detected.summary,
    }
  }

  const viewportHeight = maxLongEdge
  const viewportWidth = Math.max(minShortEdge, Math.round(maxLongEdge * aspectRatio))
  return {
    viewportWidth,
    viewportHeight,
    format: detected.orientation,
    formatLabel: detected.summary,
  }
}

/** Moldura do editor = proporção real do arquivo (logo) ou 16:9 (fundo login). */
export function resolveEditorCropViewport(
  imageWidth: number,
  imageHeight: number,
  maxLongEdge: number,
  mode: 'logo' | 'loginBackground' | 'favicon',
): LogoCropViewport {
  const detected = detectImageFormat(imageWidth, imageHeight)

  if (mode === 'loginBackground') {
    const viewportWidth = maxLongEdge
    const viewportHeight = Math.max(64, Math.round((maxLongEdge * 9) / 16))
    return {
      viewportWidth,
      viewportHeight,
      format: 'landscape',
      formatLabel: `Recorte 16:9 · arquivo ${detected.aspectLabel}`,
      detected,
    }
  }

  const frame = viewportFromAspect(detected.aspectRatio, maxLongEdge, detected)
  return { ...frame, detected }
}

export function resolveLogoCropViewport(
  imageWidth: number,
  imageHeight: number,
  maxLongEdge = SQUARE_CROP_VIEWPORT_PX,
): LogoCropViewport {
  const detected = detectImageFormat(imageWidth, imageHeight)
  const frame = viewportFromAspect(detected.aspectRatio, maxLongEdge, detected)
  return { ...frame, detected }
}

export function computeCropZoomBounds(
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number,
  maxZoom = 5,
): CropZoomBounds {
  const coverScale = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight)
  const containScale = Math.min(viewportWidth / imageWidth, viewportHeight / imageHeight)
  const minZoom = containScale / coverScale
  return {
    coverScale,
    containScale,
    minZoom,
    maxZoom,
    defaultZoom: minZoom,
  }
}

export function clampCropPan(
  imageWidth: number,
  imageHeight: number,
  zoom: number,
  panX: number,
  panY: number,
  viewportWidth: number,
  viewportHeight: number,
  zoomBounds?: Pick<CropZoomBounds, 'minZoom' | 'maxZoom'>,
): SquareCropParams {
  const coverScale = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight)
  const clampedZoom = zoomBounds
    ? Math.min(zoomBounds.maxZoom, Math.max(zoomBounds.minZoom, zoom))
    : zoom
  const scale = coverScale * clampedZoom
  const displayW = imageWidth * scale
  const displayH = imageHeight * scale

  const minPanX = Math.min(0, viewportWidth - displayW)
  const maxPanX = Math.max(0, viewportWidth - displayW)
  const minPanY = Math.min(0, viewportHeight - displayH)
  const maxPanY = Math.max(0, viewportHeight - displayH)

  return {
    zoom: clampedZoom,
    panX: Math.min(maxPanX, Math.max(minPanX, panX)),
    panY: Math.min(maxPanY, Math.max(minPanY, panY)),
  }
}

export function computeCropDisplayMetrics(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  params: SquareCropParams,
) {
  const coverScale = Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight)
  const scale = coverScale * params.zoom
  const displayW = imageWidth * scale
  const displayH = imageHeight * scale
  const drawX = (viewportWidth - displayW) / 2 + params.panX
  const drawY = (viewportHeight - displayH) / 2 + params.panY
  return { scale, displayW, displayH, drawX, drawY, coverScale }
}

/** Exporta só o que está visível dentro da moldura (suporta zoom out com imagem inteira). */
export function cropImageToDataUrl(
  image: HTMLImageElement,
  params: SquareCropParams,
  viewportWidth: number,
  viewportHeight: number,
  outputMaxEdge = SQUARE_CROP_OUTPUT_PX,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92,
): string {
  const iw = image.naturalWidth
  const ih = image.naturalHeight
  const { scale, displayW, displayH, drawX, drawY } = computeCropDisplayMetrics(
    iw,
    ih,
    viewportWidth,
    viewportHeight,
    params,
  )

  const visLeft = Math.max(0, drawX)
  const visTop = Math.max(0, drawY)
  const visRight = Math.min(viewportWidth, drawX + displayW)
  const visBottom = Math.min(viewportHeight, drawY + displayH)

  const visW = visRight - visLeft
  const visH = visBottom - visTop
  if (visW <= 0 || visH <= 0) return ''

  const srcX = Math.max(0, (visLeft - drawX) / scale)
  const srcY = Math.max(0, (visTop - drawY) / scale)
  const srcW = Math.min(iw - srcX, visW / scale)
  const srcH = Math.min(ih - srcY, visH / scale)

  if (srcW <= 0 || srcH <= 0) return ''

  const aspect = srcW / srcH
  let outputWidth: number
  let outputHeight: number
  if (aspect >= 1) {
    outputWidth = outputMaxEdge
    outputHeight = Math.max(1, Math.round(outputMaxEdge / aspect))
  } else {
    outputHeight = outputMaxEdge
    outputWidth = Math.max(1, Math.round(outputMaxEdge * aspect))
  }

  const canvas = document.createElement('canvas')
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  if (mimeType === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, outputWidth, outputHeight)
  }

  ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, outputWidth, outputHeight)
  return canvas.toDataURL(mimeType, quality)
}

export function cropSquareImageToDataUrl(
  image: HTMLImageElement,
  params: SquareCropParams,
  outputSize = SQUARE_CROP_OUTPUT_PX,
  viewport = SQUARE_CROP_VIEWPORT_PX,
  mimeType: 'image/jpeg' | 'image/png' = 'image/jpeg',
  quality = 0.92,
): string {
  return cropImageToDataUrl(image, params, viewport, viewport, outputSize, mimeType, quality)
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
