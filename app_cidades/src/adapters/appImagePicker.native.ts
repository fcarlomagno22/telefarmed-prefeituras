import * as ImagePicker from 'expo-image-picker'
import type { AppImagePickOptions, AppImagePickResult } from './appImagePicker.types'

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

export async function pickAppImage(options: AppImagePickOptions): Promise<AppImagePickResult> {
  const { source, quality = 0.85, allowsEditing = false, aspect, cameraFacing = 'back' } = options

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
          allowsEditing,
          aspect,
          quality,
          cameraType:
            cameraFacing === 'front'
              ? ImagePicker.CameraType.front
              : ImagePicker.CameraType.back,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing,
          aspect,
          quality,
        })

  if (result.canceled) {
    return { ok: false, reason: 'cancelled' }
  }

  const asset = result.assets[0]
  if (!asset?.uri) {
    return { ok: false, reason: 'unavailable' }
  }

  return {
    ok: true,
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
  }
}

export async function isAppImagePickSourceAvailable(source: AppImagePickSource): Promise<boolean> {
  if (source === 'library') return true

  const permission = await ImagePicker.getCameraPermissionsAsync()
  return permission.granted || permission.canAskAgain !== false
}
