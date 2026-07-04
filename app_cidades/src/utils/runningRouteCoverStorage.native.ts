import {
  copyAsync,
  documentDirectory,
  getInfoAsync,
  getPublicFileUri,
  makeDirectoryAsync,
} from '../adapters/fileSystem'
import { resizeImageToFit } from '../adapters/imageManipulation'
import { releaseImageSource, resolveImageSource, type AppImageInput } from '../adapters/imageSource'
import {
  RUNNING_ROUTE_COVER_COMPRESS,
  RUNNING_ROUTE_COVER_MAX_EDGE,
} from './runningRouteCoverPhotoShared'

const COVERS_DIR = 'running-route-covers'

async function ensureCoversDirUri() {
  const baseDir = documentDirectory
  if (!baseDir) {
    throw new Error('Document directory unavailable')
  }

  const dirUri = `${baseDir}${COVERS_DIR}/`
  await makeDirectoryAsync(dirUri, { intermediates: true })
  return dirUri
}

export async function persistRunningRouteCoverPhoto(sourceInput: AppImageInput) {
  const source = await resolveImageSource(sourceInput)

  try {
    const sourceInfo = await getInfoAsync(source.uri)
    if (!sourceInfo.exists) {
      throw new Error('Cover photo not found')
    }

    const resized = await resizeImageToFit(source, {
      maxLongEdge: RUNNING_ROUTE_COVER_MAX_EDGE,
      compress: RUNNING_ROUTE_COVER_COMPRESS,
    })

    const dirUri = await ensureCoversDirUri()
    const destinationUri = `${dirUri}cover-${Date.now()}.jpg`
    await copyAsync({ from: resized.uri, to: destinationUri })
    resized.revoke?.()

    return getPublicFileUri(destinationUri)
  } finally {
    releaseImageSource(source)
  }
}
