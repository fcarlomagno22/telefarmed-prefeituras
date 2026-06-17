import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { Image } from 'react-native'
import {
  computeCropRect,
  type CropMetrics,
  type CropTransform,
} from './imageCrop'

export const MEAL_PHOTO_MAX_SOURCE_EDGE = 1600
export const MEAL_PHOTO_OUTPUT_SIZE = 1024

function getImageSize(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => reject(new Error('getSize failed')),
    )
  })
}

export async function prepareMealPhotoSource(
  uri: string,
  width?: number,
  height?: number,
) {
  let resolvedWidth = width
  let resolvedHeight = height

  if (!resolvedWidth || !resolvedHeight) {
    const size = await getImageSize(uri)
    resolvedWidth = size.width
    resolvedHeight = size.height
  }

  const longEdge = Math.max(resolvedWidth, resolvedHeight)

  if (longEdge <= MEAL_PHOTO_MAX_SOURCE_EDGE) {
    return { uri, width: resolvedWidth, height: resolvedHeight }
  }

  const scale = MEAL_PHOTO_MAX_SOURCE_EDGE / longEdge
  const targetWidth = Math.round(resolvedWidth * scale)
  const targetHeight = Math.round(resolvedHeight * scale)

  const context = ImageManipulator.manipulate(uri)
  context.resize({ width: targetWidth, height: targetHeight })

  const image = await context.renderAsync()
  const saved = await image.saveAsync({
    compress: 0.88,
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

export async function saveMealPhotoCrop(
  uri: string,
  metrics: CropMetrics,
  transform: CropTransform,
) {
  const cropRect = computeCropRect(metrics, transform)
  const context = ImageManipulator.manipulate(uri)
  context.crop(cropRect)
  context.resize({
    width: MEAL_PHOTO_OUTPUT_SIZE,
    height: MEAL_PHOTO_OUTPUT_SIZE,
  })

  const image = await context.renderAsync()
  const saved = await image.saveAsync({
    compress: 0.88,
    format: SaveFormat.JPEG,
  })

  context.release()
  image.release()

  return saved.uri
}
