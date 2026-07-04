export type FaceCheckStatus = 'READY' | 'NO_FACE' | 'MULTIPLE_FACES' | 'LOW_QUALITY'

export type FaceBounds = {
  x: number
  y: number
  width: number
  height: number
}

export type FaceCheckResult = {
  status: FaceCheckStatus
  faceCount: number
  dominantFaceBounds?: FaceBounds
}

export type CheckFaceOptions = {
  minPixelSize?: number
  areaThreshold?: number
}
