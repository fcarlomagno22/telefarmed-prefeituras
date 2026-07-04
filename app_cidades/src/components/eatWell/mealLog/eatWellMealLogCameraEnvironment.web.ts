export function getEatWellMealLogCameraWebEnvironmentError(): string | null {
  if (typeof window === 'undefined') return null

  if (!window.isSecureContext) {
    return 'A câmera ao vivo exige HTTPS ou localhost. Você ainda pode enviar uma foto do dispositivo.'
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return 'Seu navegador não suporta câmera ao vivo. Envie uma foto do prato para continuar.'
  }

  return null
}

export const EAT_WELL_MEAL_LOG_CAMERA_WEB_TIP =
  'Use boa iluminação. No navegador a captura é manual — centralize o prato antes de fotografar.'

export const EAT_WELL_MEAL_LOG_CAMERA_WEB_NOTICE =
  'Versão web: foto manual pela câmera do navegador ou upload de imagem existente.'
