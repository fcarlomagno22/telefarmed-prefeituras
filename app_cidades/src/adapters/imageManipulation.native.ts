import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { Image } from 'react-native'
import type {
  CropAndResizeOptions,
  ManipulatedImage,
  ResizeByLongEdgeOptions,
  ResizeToFitOptions,
} from './imageManipulation.types'
import type { ResolvedImageSource } from './imageSource.types'

function getImageSize(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => reject(new Error('getSize failed')),
    )
  })
}

async function resolveDimensions(
  source: ResolvedImageSource,
): Promise<{ width: number; height: number }> {
  if (source.width && source.height) {
    return { width: source.width, height: source.height }
  }

  return getImageSize(source.uri)
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

  const context = ImageManipulator.manipulate(source.uri)
  context.resize({ width: targetWidth, height: targetHeight })

  const image = await context.renderAsync()
  const saved = await image.saveAsync({
    compress: options.compress,
    format: SaveFormat.JPEG,
  })

  const result = {
    uri: saved.uri,
    width: image.width,
    height: image.height,
  }

  context.release()
  image.release()

  return result
}

export async function cropAndResizeImage(
  source: ResolvedImageSource,
  options: CropAndResizeOptions,
): Promise<ManipulatedImage> {
  const context = ImageManipulator.manipulate(source.uri)
  context.crop(options.cropRect)
  context.resize({
    width: options.outputSize,
    height: options.outputSize,
  })

  const image = await context.renderAsync()
  const saved = await image.saveAsync({
    compress: options.compress,
    format: SaveFormat.JPEG,
  })

  context.release()
  image.release()

  return {
    uri: saved.uri,
    width: options.outputSize,
    height: options.outputSize,
  }
}

export async function resizeImageToFit(
  source: ResolvedImageSource,
  options: ResizeToFitOptions,
): Promise<ManipulatedImage> {
  const context = ImageManipulator.manipulate(source.uri)
  const image = await context.renderAsync()
  const { width, height } = image

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
    const saved = await image.saveAsync({
      compress: options.compress,
      format: SaveFormat.JPEG,
    })
    context.release()
    image.release()
    return { uri: saved.uri, width, height }
  }

  const resized = await image.resize({ width: resizeWidth, height: resizeHeight })
  const saved = await resized.saveAsync({
    compress: options.compress,
    format: SaveFormat.JPEG,
  })

  context.release()
  image.release()

  return {
    uri: saved.uri,
    width: resizeWidth,
    height: resizeHeight,
  }
}

export type {
  CropAndResizeOptions,
  ManipulatedImage,
  ResizeByLongEdgeOptions,
  ResizeToFitOptions,
} from './imageManipulation.types'
