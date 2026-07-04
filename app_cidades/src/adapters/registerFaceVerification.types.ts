export type RegisterFaceVerificationMode =
  | 'auto_scan_with_manual_fallback'
  | 'manual_selfie_with_gallery_fallback'
  | 'manual_selfie_only'

/**
 * Platform contract for the registration face-verification step.
 * Used by RegisterStepFaceScan to choose UX and to document functional gaps.
 */
export type RegisterFaceVerificationCapabilities = {
  mode: RegisterFaceVerificationMode
  supportsAutoFaceDetection: boolean
  supportsLiveCamera: boolean
  supportsGalleryUpload: boolean
  limitations: readonly string[]
  stepTitle: string
  stepSubtitle: string
  platformNotice: string | null
  previewBadgeText: string
}
