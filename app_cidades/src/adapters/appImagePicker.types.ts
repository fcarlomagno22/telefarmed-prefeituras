export type AppImagePickSource = 'camera' | 'library'

export type AppImagePickCameraFacing = 'front' | 'back'

export type AppImagePickOptions = {
  source: AppImagePickSource
  quality?: number
  allowsEditing?: boolean
  aspect?: [number, number]
  cameraFacing?: AppImagePickCameraFacing
}

export type AppImagePickFailureReason = 'cancelled' | 'permission_denied' | 'unavailable'

export type AppImagePickResult =
  | { ok: true; uri: string; width?: number; height?: number }
  | { ok: false; reason: AppImagePickFailureReason; message?: string }

export const APP_IMAGE_PICKER_WEB_LIMITATIONS = {
  allowsEditing: 'Recorte nativo do picker não está disponível na web; a imagem é usada como enviada.',
  camera: 'Câmera ao vivo na web exige HTTPS ou localhost e gesto do usuário.',
} as const

export function getAppImagePickPermissionMessage(source: AppImagePickSource): string {
  if (source === 'camera') {
    return 'Precisamos da câmera para capturar a imagem.'
  }
  return 'Precisamos acessar sua galeria ou arquivos para escolher a imagem.'
}
