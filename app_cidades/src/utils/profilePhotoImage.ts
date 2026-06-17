import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  EncodingType,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
} from 'expo-file-system/legacy'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'
import { Image } from 'react-native'
import {
  computeCropRect,
  type CropMetrics,
  type CropTransform,
} from './imageCrop'

export async function profilePhotoToDataUri(uri: string): Promise<string | null> {
  const trimmed = uri.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('data:')) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed

  try {
    const info = await getInfoAsync(trimmed)
    if (!info.exists) return null

    const base64 = await readAsStringAsync(trimmed, {
      encoding: EncodingType.Base64,
    })
    return `data:image/jpeg;base64,${base64}`
  } catch {
    return null
  }
}

export const PROFILE_PHOTO_MAX_SOURCE_EDGE = 1024
export const PROFILE_PHOTO_OUTPUT_SIZE = 256
const PROFILE_PHOTOS_DIR = 'profile-photos'

async function ensureProfilePhotoDirUri() {
  const baseDir = documentDirectory
  if (!baseDir) {
    throw new Error('Document directory unavailable')
  }

  const dirUri = `${baseDir}${PROFILE_PHOTOS_DIR}/`
  await makeDirectoryAsync(dirUri, { intermediates: true })
  return dirUri
}

export async function persistProfilePhoto(tempUri: string, previousUri?: string | null) {
  const sourceInfo = await getInfoAsync(tempUri)
  if (!sourceInfo.exists) {
    throw new Error('Temporary photo not found')
  }

  const dirUri = await ensureProfilePhotoDirUri()
  const destinationUri = `${dirUri}avatar-${Date.now()}.jpg`
  await copyAsync({ from: tempUri, to: destinationUri })

  if (previousUri?.includes(PROFILE_PHOTOS_DIR)) {
    try {
      const previousInfo = await getInfoAsync(previousUri)
      if (previousInfo.exists) {
        await deleteAsync(previousUri, { idempotent: true })
      }
    } catch {
      // Ignore cleanup errors for old photos.
    }
  }

  return destinationUri
}

function getImageSize(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => reject(new Error('getSize failed')),
    )
  })
}

export async function prepareProfilePhotoSource(
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

  if (longEdge <= PROFILE_PHOTO_MAX_SOURCE_EDGE) {
    return { uri, width: resolvedWidth, height: resolvedHeight }
  }

  const scale = PROFILE_PHOTO_MAX_SOURCE_EDGE / longEdge
  const targetWidth = Math.round(resolvedWidth * scale)
  const targetHeight = Math.round(resolvedHeight * scale)

  const context = ImageManipulator.manipulate(uri)
  context.resize({ width: targetWidth, height: targetHeight })

  const image = await context.renderAsync()
  const saved = await image.saveAsync({
    compress: 0.82,
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

export async function saveProfilePhotoCrop(
  uri: string,
  metrics: CropMetrics,
  transform: CropTransform,
) {
  const cropRect = computeCropRect(metrics, transform)
  const context = ImageManipulator.manipulate(uri)
  context.crop(cropRect)
  context.resize({
    width: PROFILE_PHOTO_OUTPUT_SIZE,
    height: PROFILE_PHOTO_OUTPUT_SIZE,
  })

  const image = await context.renderAsync()
  const saved = await image.saveAsync({
    compress: 0.82,
    format: SaveFormat.JPEG,
  })

  context.release()
  image.release()

  return saved.uri
}
