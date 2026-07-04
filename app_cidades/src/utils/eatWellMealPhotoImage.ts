import {
  cropAndResizeImage,
  resizeImageByLongEdge,
} from '../adapters/imageManipulation'
import {
  releaseImageSource,
  resolveImageSource,
  type AppImageInput,
} from '../adapters/imageSource'
import {
  computeCropRect,
  type CropMetrics,
  type CropTransform,
} from './imageCrop'

export type { AppImageInput } from '../adapters/imageSource'

export const MEAL_PHOTO_MAX_SOURCE_EDGE = 1600
export const MEAL_PHOTO_OUTPUT_SIZE = 1024

export async function prepareMealPhotoSource(
  input: AppImageInput,
  width?: number,
  height?: number,
) {
  const source = await resolveImageSource(input, width, height)

  try {
    return await resizeImageByLongEdge(source, {
      maxLongEdge: MEAL_PHOTO_MAX_SOURCE_EDGE,
      compress: 0.88,
    })
  } finally {
    releaseImageSource(source)
  }
}

export async function saveMealPhotoCrop(
  input: AppImageInput,
  metrics: CropMetrics,
  transform: CropTransform,
) {
  const source = await resolveImageSource(input)
  const cropRect = computeCropRect(metrics, transform)

  try {
    const result = await cropAndResizeImage(source, {
      cropRect,
      outputSize: MEAL_PHOTO_OUTPUT_SIZE,
      compress: 0.88,
    })

    return result.uri
  } finally {
    releaseImageSource(source)
  }
}
