import { requireOptionalNativeModule } from 'expo-modules-core'

export type FaceBounds = {
  x: number
  y: number
  width: number
  height: number
}

export type FrameFaceReason =
  | 'no_face'
  | 'multiple_faces'
  | 'low_quality'
  | 'off_center'
  | 'unavailable'

export type FrameFaceResult =
  | { ok: true; bounds: FaceBounds }
  | { ok: false; reason: FrameFaceReason }

type FaceCheckResult = {
  status: 'READY' | 'NO_FACE' | 'MULTIPLE_FACES' | 'LOW_QUALITY'
  faceCount: number
  dominantFaceBounds?: FaceBounds
}

type CheckFaceOptions = {
  minPixelSize?: number
  areaThreshold?: number
}

type ExpoFaceCheckNativeModule = {
  checkFace: (imageUri: string, options: CheckFaceOptions) => Promise<FaceCheckResult>
}

let faceCheckModule: ExpoFaceCheckNativeModule | null | undefined

function getFaceCheckModule(): ExpoFaceCheckNativeModule | null {
  if (faceCheckModule !== undefined) return faceCheckModule

  faceCheckModule = requireOptionalNativeModule<ExpoFaceCheckNativeModule>('ExpoFaceCheck')
  return faceCheckModule
}

export function isFaceDetectionAvailable(): boolean {
  return getFaceCheckModule() != null
}

function isFaceWellPositioned(
  bounds: FaceBounds,
  imageWidth: number,
  imageHeight: number,
): boolean {
  const centerX = (bounds.x + bounds.width / 2) / imageWidth
  const centerY = (bounds.y + bounds.height / 2) / imageHeight
  const areaRatio = (bounds.width * bounds.height) / (imageWidth * imageHeight)

  return (
    centerX >= 0.3 &&
    centerX <= 0.7 &&
    centerY >= 0.26 &&
    centerY <= 0.64 &&
    areaRatio >= 0.05 &&
    areaRatio <= 0.48
  )
}

export async function analyzeCameraFrame(
  uri: string,
  width: number,
  height: number,
): Promise<FrameFaceResult> {
  const module = getFaceCheckModule()
  if (!module) {
    return { ok: false, reason: 'unavailable' }
  }

  try {
    const result = await module.checkFace(uri, {
      minPixelSize: 36_000,
      areaThreshold: 0.2,
    })

    if (result.status === 'NO_FACE') {
      return { ok: false, reason: 'no_face' }
    }

    if (result.status === 'MULTIPLE_FACES') {
      return { ok: false, reason: 'multiple_faces' }
    }

    if (result.status === 'LOW_QUALITY') {
      return { ok: false, reason: 'low_quality' }
    }

    if (!result.dominantFaceBounds) {
      return { ok: false, reason: 'no_face' }
    }

    if (!isFaceWellPositioned(result.dominantFaceBounds, width, height)) {
      return { ok: false, reason: 'off_center' }
    }

    return { ok: true, bounds: result.dominantFaceBounds }
  } catch {
    return { ok: false, reason: 'unavailable' }
  }
}
