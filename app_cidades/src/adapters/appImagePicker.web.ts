import * as ImagePicker from 'expo-image-picker'
import type { AppImagePickOptions, AppImagePickResult, AppImagePickSource } from './appImagePicker.types'
import { APP_IMAGE_PICKER_WEB_LIMITATIONS } from './appImagePicker.types'

export type {
  AppImagePickCameraFacing,
  AppImagePickFailureReason,
  AppImagePickOptions,
  AppImagePickResult,
  AppImagePickSource,
} from './appImagePicker.types'

export {
  APP_IMAGE_PICKER_WEB_LIMITATIONS,
  getAppImagePickPermissionMessage,
} from './appImagePicker.types'

function getWebCameraUnavailableMessage(): string {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'A câmera ao vivo exige HTTPS ou localhost. Escolha um arquivo do dispositivo.'
  }

  if (typeof navigator !== 'undefined' && !navigator.mediaDevices?.getUserMedia) {
    return 'Seu navegador não suporta câmera ao vivo. Escolha um arquivo do dispositivo.'
  }

  return 'Câmera ao vivo indisponível. Escolha um arquivo do dispositivo.'
}

function isWebLiveCameraAvailable(): boolean {
  if (typeof window === 'undefined') return false
  if (!window.isSecureContext) return false
  return Boolean(navigator.mediaDevices?.getUserMedia)
}

export async function pickAppImage(options: AppImagePickOptions): Promise<AppImagePickResult> {
  const { source, quality = 0.85, cameraFacing = 'back' } = options

  if (source === 'camera' && !isWebLiveCameraAvailable()) {
    return {
      ok: false,
      reason: 'unavailable',
      message: getWebCameraUnavailableMessage(),
    }
  }

  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

  if (!permission.granted) {
    return { ok: false, reason: 'permission_denied' }
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality,
          cameraType:
            cameraFacing === 'front'
              ? ImagePicker.CameraType.front
              : ImagePicker.CameraType.back,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality,
          allowsMultipleSelection: false,
        })

  if (result.canceled) {
    return { ok: false, reason: 'cancelled' }
  }

  const asset = result.assets[0]
  if (!asset?.uri) {
    return { ok: false, reason: 'unavailable', message: 'Não foi possível ler o arquivo selecionado.' }
  }

  return {
    ok: true,
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
  }
}

export async function isAppImagePickSourceAvailable(source: AppImagePickSource): Promise<boolean> {
  if (source === 'library') {
    const permission = await ImagePicker.getMediaLibraryPermissionsAsync()
    return permission.granted || permission.canAskAgain !== false
  }

  return isWebLiveCameraAvailable()
}

export function getAppImagePickerWebEditingNotice(wantedEditing: boolean): string | null {
  if (!wantedEditing) return null
  return APP_IMAGE_PICKER_WEB_LIMITATIONS.allowsEditing
}
