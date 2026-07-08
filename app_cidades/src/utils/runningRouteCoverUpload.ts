import { EncodingType, readAsStringAsync } from '../adapters/fileSystem'
import { createRunWalkLocalCoverUploadUrl } from '../lib/api/vd/runWalk'

function isRemoteCoverUri(uri: string) {
  const trimmed = uri.trim()
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('sb://')
  )
}

async function readLocalImageBytes(localUri: string): Promise<Uint8Array> {
  if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
    const response = await fetch(localUri)
    if (!response.ok) {
      throw new Error('Não foi possível ler a foto do local.')
    }
    const buffer = await response.arrayBuffer()
    return new Uint8Array(buffer)
  }

  const base64 = await readAsStringAsync(localUri, { encoding: EncodingType.Base64 })
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

export async function uploadRunningRouteCoverPhoto(localUri: string): Promise<{
  storagePath: string
  coverPhotoReference: string
}> {
  if (isRemoteCoverUri(localUri)) {
    return {
      storagePath: localUri,
      coverPhotoReference: localUri,
    }
  }

  const uploadMeta = await createRunWalkLocalCoverUploadUrl()
  const bytes = await readLocalImageBytes(localUri)

  const uploadResponse = await fetch(uploadMeta.signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'image/jpeg',
      Authorization: `Bearer ${uploadMeta.token}`,
    },
    body: bytes,
  })

  if (!uploadResponse.ok) {
    throw new Error('Não foi possível enviar a foto do local.')
  }

  return {
    storagePath: uploadMeta.storagePath,
    coverPhotoReference: uploadMeta.coverPhotoReference,
  }
}
