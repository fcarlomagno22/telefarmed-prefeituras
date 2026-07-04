/**
 * Web profile photo persistence without a local filesystem.
 * Avatars are normalized to data: URIs (small JPEG) for in-app state and map embeds.
 */

function revokeBlobUri(uri: string) {
  if (uri.startsWith('blob:')) {
    URL.revokeObjectURL(uri)
  }
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Failed to encode profile photo'))
    }
    reader.onerror = () => reject(new Error('Failed to read profile photo blob'))
    reader.readAsDataURL(blob)
  })
}

async function uriToDataUri(uri: string): Promise<string | null> {
  const trimmed = uri.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('data:')) return trimmed
  if (trimmed.startsWith('file:')) {
    throw new Error('file:// URIs are not supported for profile photos on web.')
  }

  try {
    const response = await fetch(trimmed)
    if (!response.ok) return null
    return blobToDataUri(await response.blob())
  } catch {
    return null
  }
}

export async function profilePhotoToDataUri(uri: string): Promise<string | null> {
  return uriToDataUri(uri)
}

export async function persistProfilePhoto(tempUri: string, previousUri?: string | null) {
  const dataUri = await uriToDataUri(tempUri)
  if (!dataUri) {
    throw new Error('Temporary photo not found')
  }

  revokeBlobUri(tempUri)

  if (previousUri?.startsWith('blob:')) {
    revokeBlobUri(previousUri)
  }

  return dataUri
}
