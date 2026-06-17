export type FaceBox = {
  x: number
  y: number
  width: number
  height: number
}

export type OvalGuide = {
  centerX: number
  centerY: number
  radiusX: number
  radiusY: number
}

export function getOvalGuide(videoWidth: number, videoHeight: number): OvalGuide {
  return {
    centerX: videoWidth * 0.5,
    centerY: videoHeight * 0.44,
    radiusX: videoWidth * 0.2,
    radiusY: videoHeight * 0.27,
  }
}

/** Converte caixa do detector (espelhada na pré-visualização) para coordenadas da tela. */
export function mirrorFaceBox(box: FaceBox, videoWidth: number): FaceBox {
  return {
    x: videoWidth - box.x - box.width,
    y: box.y,
    width: box.width,
    height: box.height,
  }
}

export function isFaceAlignedInOval(face: FaceBox, guide: OvalGuide): boolean {
  const faceCenterX = face.x + face.width / 2
  const faceCenterY = face.y + face.height / 2

  const dx = (faceCenterX - guide.centerX) / guide.radiusX
  const dy = (faceCenterY - guide.centerY) / guide.radiusY
  const centerInside = dx * dx + dy * dy <= 0.42

  const ovalWidth = guide.radiusX * 2
  const minFaceWidth = ovalWidth * 0.42
  const maxFaceWidth = ovalWidth * 0.92
  const sizeOk = face.width >= minFaceWidth && face.width <= maxFaceWidth

  return centerInside && sizeOk
}

const SELFIE_CAPTURE_MAX_PX = 512
const SELFIE_CAPTURE_JPEG_QUALITY = 0.82

/** Recorte quadrado (sem máscara oval) para evitar faixas pretas na pré-visualização. */
export function captureMirroredOvalFrame(
  video: HTMLVideoElement,
  guide: OvalGuide,
): string {
  const width = video.videoWidth
  const height = video.videoHeight
  if (!width || !height) return ''

  const cropSize = Math.round(
    Math.min(
      Math.max(guide.radiusX, guide.radiusY) * 2.35,
      width * 0.92,
      height * 0.92,
    ),
  )
  const outputSize = Math.min(cropSize, SELFIE_CAPTURE_MAX_PX)

  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  let sourceX = guide.centerX - cropSize / 2
  let sourceY = guide.centerY - cropSize / 2
  sourceX = Math.max(0, Math.min(sourceX, width - cropSize))
  sourceY = Math.max(0, Math.min(sourceY, height - cropSize))

  ctx.translate(canvas.width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(
    video,
    sourceX,
    sourceY,
    cropSize,
    cropSize,
    0,
    0,
    outputSize,
    outputSize,
  )

  return canvas.toDataURL('image/jpeg', SELFIE_CAPTURE_JPEG_QUALITY)
}
