import { requireOptionalNativeModule } from 'expo-modules-core'
import type { CheckFaceOptions, FaceCheckResult } from './faceCheck.types'

type ExpoFaceCheckNativeModule = {
  checkFace: (imageUri: string, options?: CheckFaceOptions) => Promise<FaceCheckResult>
}

let faceCheckModule: ExpoFaceCheckNativeModule | null | undefined

function getFaceCheckModule(): ExpoFaceCheckNativeModule | null {
  if (faceCheckModule !== undefined) return faceCheckModule

  faceCheckModule = requireOptionalNativeModule<ExpoFaceCheckNativeModule>('ExpoFaceCheck')
  return faceCheckModule
}

export function isFaceCheckSupported(): boolean {
  return getFaceCheckModule() != null
}

export async function checkFaceAsync(
  imageUri: string,
  options?: CheckFaceOptions,
): Promise<FaceCheckResult> {
  const module = getFaceCheckModule()
  if (!module) {
    throw new Error('Face check native module is unavailable')
  }

  return module.checkFace(imageUri, options)
}
