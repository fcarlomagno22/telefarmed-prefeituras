/**
 * Web fallback for registration face verification.
 *
 * Native mobile uses ML-backed face detection (ExpoFaceCheck) with an animated
 * auto-scan flow. Browsers in this project do not load that native module, so
 * web registration intentionally uses a reduced, explicit path:
 *
 * 1. Live front camera via expo-camera (manual shutter) when HTTPS + permission OK.
 * 2. Gallery / file picker when the live camera is unavailable or denied.
 *
 * What web does NOT do (by design):
 * - No automatic face lock or liveness scan animation tied to detection.
 * - No validation of face count, framing, or quality before accepting the photo.
 * - Backend or future server-side checks must treat web selfies accordingly.
 */
import type { RegisterFaceVerificationCapabilities } from './registerFaceVerification.types'

export const REGISTER_FACE_VERIFICATION_WEB_LIMITATIONS: readonly string[] = []

export const registerFaceVerification: RegisterFaceVerificationCapabilities = {
  mode: 'manual_selfie_with_gallery_fallback',
  supportsAutoFaceDetection: false,
  supportsLiveCamera: true,
  supportsGalleryUpload: true,
  limitations: REGISTER_FACE_VERIFICATION_WEB_LIMITATIONS,
  stepTitle: 'Faça sua Identificação Facial',
  stepSubtitle: '',
  platformNotice: null,
  previewBadgeText: 'Identificação registrada',
}

export function getRegisterFaceScanWebEnvironmentError(): string | null {
  if (typeof window === 'undefined') return null

  if (!window.isSecureContext) {
    return 'A câmera ao vivo exige HTTPS ou localhost. Você ainda pode enviar uma foto do dispositivo abaixo.'
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return 'Seu navegador não suporta câmera ao vivo. Envie uma foto do dispositivo para continuar.'
  }

  return null
}

export const REGISTER_FACE_SCAN_WEB_PERMISSION_DENIED_COPY = {
  title: 'Câmera bloqueada no navegador',
  message:
    'O acesso à câmera foi negado. Permita a câmera no ícone da barra de endereço ou envie uma foto do dispositivo.',
  allowLabel: 'Tentar câmera novamente',
  dismissLabel: 'Agora não',
}

export const REGISTER_FACE_SCAN_WEB_PERMISSION_PROMPT_COPY = {
  title: 'Acesso à câmera',
  message:
    'Usamos a câmera frontal só nesta etapa. O navegador vai pedir permissão — escolha Permitir — ou envie uma foto do dispositivo.',
  allowLabel: 'Permitir câmera',
  dismissLabel: 'Agora não',
}
