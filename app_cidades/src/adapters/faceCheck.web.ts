import type { CheckFaceOptions, FaceCheckResult } from './faceCheck.types'

export function isFaceCheckSupported(): boolean {
  return false
}

export async function checkFaceAsync(
  _imageUri: string,
  _options?: CheckFaceOptions,
): Promise<FaceCheckResult> {
  throw new Error('Face check is not available on web')
}
