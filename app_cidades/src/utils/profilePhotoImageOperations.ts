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
import {
  PROFILE_PHOTO_MAX_SOURCE_EDGE,
  PROFILE_PHOTO_OUTPUT_SIZE,
} from './profilePhotoImageShared'

export async function prepareProfilePhotoSource(
  input: AppImageInput,
  width?: number,
  height?: number,
) {
  const source = await resolveImageSource(input, width, height)

  try {
    return await resizeImageByLongEdge(source, {
      maxLongEdge: PROFILE_PHOTO_MAX_SOURCE_EDGE,
      compress: 0.82,
    })
  } finally {
    releaseImageSource(source)
  }
}

export async function saveProfilePhotoCrop(
  input: AppImageInput,
  metrics: CropMetrics,
  transform: CropTransform,
) {
  const source = await resolveImageSource(input)
  const cropRect = computeCropRect(metrics, transform)

  try {
    const result = await cropAndResizeImage(source, {
      cropRect,
      outputSize: PROFILE_PHOTO_OUTPUT_SIZE,
      compress: 0.82,
    })

    return result.uri
  } finally {
    releaseImageSource(source)
  }
}
