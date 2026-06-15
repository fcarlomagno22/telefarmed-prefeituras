export type CropTransform = {
  scale: number
  translateX: number
  translateY: number
}

export type CropMetrics = {
  cropSize: number
  displayWidth: number
  displayHeight: number
  imageWidth: number
  imageHeight: number
}

export type CropRect = {
  originX: number
  originY: number
  width: number
  height: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function getCoverDisplaySize(
  imageWidth: number,
  imageHeight: number,
  cropSize: number,
) {
  const aspect = imageWidth / imageHeight

  if (aspect >= 1) {
    return {
      displayWidth: cropSize * aspect,
      displayHeight: cropSize,
    }
  }

  return {
    displayWidth: cropSize,
    displayHeight: cropSize / aspect,
  }
}

export function clampCropTransform(
  transform: CropTransform,
  metrics: CropMetrics,
  minScale = 1,
  maxScale = 4,
): CropTransform {
  const scale = clamp(transform.scale, minScale, maxScale)
  const renderedW = metrics.displayWidth * scale
  const renderedH = metrics.displayHeight * scale
  const maxTranslateX = Math.max(0, (renderedW - metrics.cropSize) / 2)
  const maxTranslateY = Math.max(0, (renderedH - metrics.cropSize) / 2)

  return {
    scale,
    translateX: clamp(transform.translateX, -maxTranslateX, maxTranslateX),
    translateY: clamp(transform.translateY, -maxTranslateY, maxTranslateY),
  }
}

export function computeCropRect(
  metrics: CropMetrics,
  transform: CropTransform,
): CropRect {
  const { cropSize, displayWidth, displayHeight, imageWidth, imageHeight } = metrics
  const { scale, translateX, translateY } = transform
  const renderedW = displayWidth * scale
  const renderedH = displayHeight * scale
  const left = cropSize / 2 - renderedW / 2 + translateX
  const top = cropSize / 2 - renderedH / 2 + translateY

  const originX = clamp(((0 - left) / renderedW) * imageWidth, 0, imageWidth - 1)
  const originY = clamp(((0 - top) / renderedH) * imageHeight, 0, imageHeight - 1)
  const cropWidth = clamp((cropSize / renderedW) * imageWidth, 1, imageWidth - originX)
  const cropHeight = clamp((cropSize / renderedH) * imageHeight, 1, imageHeight - originY)
  const size = Math.min(cropWidth, cropHeight)

  return sanitizeCropRect(
    {
      originX: Math.round(originX),
      originY: Math.round(originY),
      width: Math.round(size),
      height: Math.round(size),
    },
    imageWidth,
    imageHeight,
  )
}

export function sanitizeCropRect(
  rect: CropRect,
  imageWidth: number,
  imageHeight: number,
): CropRect {
  const originX = clamp(Math.floor(rect.originX), 0, Math.max(0, imageWidth - 1))
  const originY = clamp(Math.floor(rect.originY), 0, Math.max(0, imageHeight - 1))
  const maxSize = Math.min(imageWidth - originX, imageHeight - originY)
  const size = clamp(Math.floor(rect.width), 1, Math.max(1, maxSize))

  return {
    originX,
    originY,
    width: size,
    height: size,
  }
}
