import type { AppImageInput, ResolvedImageSource } from './imageSource.types'

export type { AppImageInput, ResolvedImageSource } from './imageSource.types'

export async function resolveImageSource(
  input: AppImageInput,
  width?: number,
  height?: number,
): Promise<ResolvedImageSource> {
  if (typeof input !== 'string') {
    throw new Error('Native image pipeline expects a local URI string from the image picker or camera.')
  }

  const uri = input.trim()
  if (!uri) {
    throw new Error('Image URI is empty.')
  }

  return { uri, width, height }
}

export function releaseImageSource(_source: ResolvedImageSource) {
  // Native URIs are managed by the OS; nothing to revoke.
}
