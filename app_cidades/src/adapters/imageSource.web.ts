import { getPublicFileUri } from './fileSystem'
import type { AppImageInput, ResolvedImageSource } from './imageSource.types'

export type { AppImageInput, ResolvedImageSource } from './imageSource.types'

function isManagedStorageUri(uri: string): boolean {
  return uri.startsWith('webfs://')
}

export async function resolveImageSource(
  input: AppImageInput,
  width?: number,
  height?: number,
): Promise<ResolvedImageSource> {
  if (input instanceof Blob) {
    const uri = URL.createObjectURL(input)
    return {
      uri,
      width,
      height,
      blob: input,
      revoke: () => URL.revokeObjectURL(uri),
    }
  }

  if (typeof File !== 'undefined' && input instanceof File) {
    const uri = URL.createObjectURL(input)
    return {
      uri,
      width,
      height,
      blob: input,
      revoke: () => URL.revokeObjectURL(uri),
    }
  }

  const uri = input.trim()
  if (!uri) {
    throw new Error('Image URI is empty.')
  }

  if (isManagedStorageUri(uri)) {
    return {
      uri: getPublicFileUri(uri),
      width,
      height,
    }
  }

  if (uri.startsWith('blob:') || uri.startsWith('data:') || /^https?:\/\//i.test(uri)) {
    return { uri, width, height }
  }

  if (uri.startsWith('file:')) {
    throw new Error(
      'URIs file:// não são suportadas no navegador. Use Blob, File ou uma URL blob/data retornada pelo picker.',
    )
  }

  return { uri, width, height }
}

export function releaseImageSource(source: ResolvedImageSource) {
  source.revoke?.()
}
