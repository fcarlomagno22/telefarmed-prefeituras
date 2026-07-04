import type {
  CropAndResizeOptions,
  ManipulatedImage,
  ResizeByLongEdgeOptions,
  ResizeToFitOptions,
} from './imageManipulation.types'
import type { ResolvedImageSource } from './imageSource.types'

function loadHtmlImage(source: ResolvedImageSource): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Failed to decode image in browser'))
    image.src = source.uri
  })
}

async function resolveDimensions(source: ResolvedImageSource): Promise<{ width: number; height: number }> {
  if (source.width && source.height) {
    return { width: source.width, height: source.height }
  }

  const image = await loadHtmlImage(source)
  return { width: image.naturalWidth, height: image.naturalHeight }
}

function canvasToBlob(canvas: HTMLCanvasElement, compress: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }
        reject(new Error('Canvas export failed'))
      },
      'image/jpeg',
      compress,
    )
  })
}

async function renderCanvas(
  source: ResolvedImageSource,
  draw: (context: CanvasRenderingContext2D, image: HTMLImageElement) => void,
  width: number,
  height: number,
  compress: number,
): Promise<ManipulatedImage> {
  const image = await loadHtmlImage(source)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context unavailable')
  }

  draw(context, image)

  const blob = await canvasToBlob(canvas, compress)
  const uri = URL.createObjectURL(blob)

  return {
    uri,
    width,
    height,
    revoke: () => URL.revokeObjectURL(uri),
  }
}

export async function resizeImageByLongEdge(
  source: ResolvedImageSource,
  options: ResizeByLongEdgeOptions,
): Promise<ManipulatedImage> {
  const { width, height } = await resolveDimensions(source)
  const longEdge = Math.max(width, height)

  if (longEdge <= options.maxLongEdge) {
    return { uri: source.uri, width, height }
  }

  const scale = options.maxLongEdge / longEdge
  const targetWidth = Math.round(width * scale)
  const targetHeight = Math.round(height * scale)

  return renderCanvas(
    source,
    (context, image) => {
      context.drawImage(image, 0, 0, targetWidth, targetHeight)
    },
    targetWidth,
    targetHeight,
    options.compress,
  )
}

export async function cropAndResizeImage(
  source: ResolvedImageSource,
  options: CropAndResizeOptions,
): Promise<ManipulatedImage> {
  const { cropRect, outputSize, compress } = options

  return renderCanvas(
    source,
    (context, image) => {
      context.drawImage(
        image,
        cropRect.originX,
        cropRect.originY,
        cropRect.width,
        cropRect.height,
        0,
        0,
        outputSize,
        outputSize,
      )
    },
    outputSize,
    outputSize,
    compress,
  )
}

export async function resizeImageToFit(
  source: ResolvedImageSource,
  options: ResizeToFitOptions,
): Promise<ManipulatedImage> {
  const { width, height } = await resolveDimensions(source)

  let resizeWidth = width
  let resizeHeight = height

  if (width >= height && width > options.maxLongEdge) {
    resizeWidth = options.maxLongEdge
    resizeHeight = Math.round((height / width) * options.maxLongEdge)
  } else if (height > options.maxLongEdge) {
    resizeHeight = options.maxLongEdge
    resizeWidth = Math.round((width / height) * options.maxLongEdge)
  }

  if (resizeWidth === width && resizeHeight === height) {
    return { uri: source.uri, width, height }
  }

  return renderCanvas(
    source,
    (context, image) => {
      context.drawImage(image, 0, 0, resizeWidth, resizeHeight)
    },
    resizeWidth,
    resizeHeight,
    options.compress,
  )
}

export type {
  CropAndResizeOptions,
  ManipulatedImage,
  ResizeByLongEdgeOptions,
  ResizeToFitOptions,
} from './imageManipulation.types'
