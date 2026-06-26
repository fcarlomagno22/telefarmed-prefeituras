import {
  copyAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy'
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator'

const COVERS_DIR = 'running-route-covers'
const MAX_EDGE = 1280

async function ensureCoversDirUri() {
  const baseDir = documentDirectory
  if (!baseDir) {
    throw new Error('Document directory unavailable')
  }

  const dirUri = `${baseDir}${COVERS_DIR}/`
  await makeDirectoryAsync(dirUri, { intermediates: true })
  return dirUri
}

export async function persistRunningRouteCoverPhoto(sourceUri: string) {
  const sourceInfo = await getInfoAsync(sourceUri)
  if (!sourceInfo.exists) {
    throw new Error('Cover photo not found')
  }

  const context = ImageManipulator.manipulate(sourceUri)
  const image = await context.renderAsync()
  const { width, height } = image

  let resizeWidth = width
  let resizeHeight = height

  if (width >= height && width > MAX_EDGE) {
    resizeWidth = MAX_EDGE
    resizeHeight = Math.round((height / width) * MAX_EDGE)
  } else if (height > MAX_EDGE) {
    resizeHeight = MAX_EDGE
    resizeWidth = Math.round((width / height) * MAX_EDGE)
  }

  const resized = await image.resize({ width: resizeWidth, height: resizeHeight })
  const saved = await resized.saveAsync({
    compress: 0.82,
    format: SaveFormat.JPEG,
  })

  const dirUri = await ensureCoversDirUri()
  const destinationUri = `${dirUri}cover-${Date.now()}.jpg`
  await copyAsync({ from: saved.uri, to: destinationUri })
  return destinationUri
}
