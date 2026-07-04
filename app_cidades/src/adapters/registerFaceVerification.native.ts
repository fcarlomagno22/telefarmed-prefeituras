import { isFaceDetectionAvailable } from '../utils/faceDetection'
import type { RegisterFaceVerificationCapabilities } from './registerFaceVerification.types'

const autoFaceDetection = isFaceDetectionAvailable()

export const registerFaceVerification: RegisterFaceVerificationCapabilities = {
  mode: autoFaceDetection ? 'auto_scan_with_manual_fallback' : 'manual_selfie_only',
  supportsAutoFaceDetection: autoFaceDetection,
  supportsLiveCamera: true,
  supportsGalleryUpload: false,
  limitations: autoFaceDetection
    ? []
    : [
        'Detecção facial automática indisponível neste build (ex.: Expo Go).',
        'A captura é manual; o app compilado habilita o scanner automático.',
      ],
  stepTitle: 'Verificação facial',
  stepSubtitle: autoFaceDetection
    ? 'Enquadre seu rosto no oval. O escaneamento só começa quando detectarmos você na câmera.'
    : 'Centralize seu rosto no oval e capture a selfie para continuar.',
  platformNotice: autoFaceDetection
    ? null
    : 'No Expo Go a detecção automática não está disponível. Use o botão abaixo para capturar a foto. No app compilado, o scanner detecta o rosto sozinho.',
  previewBadgeText: 'Foto capturada com sucesso',
}
