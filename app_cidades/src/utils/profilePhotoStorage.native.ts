import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  EncodingType,
  getInfoAsync,
  getPublicFileUri,
  makeDirectoryAsync,
  readAsStringAsync,
} from '../adapters/fileSystem'

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

  return getPublicFileUri(destinationUri)
}
