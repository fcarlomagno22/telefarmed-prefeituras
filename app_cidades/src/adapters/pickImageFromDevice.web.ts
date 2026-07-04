import { pickAppImage, type AppImagePickResult } from './appImagePicker.web'

export type PickImageFromDeviceWebResult = AppImagePickResult

/** @deprecated Prefer pickAppImage({ source: 'library' }) from appImagePicker. */
export async function pickImageFromDeviceWeb(): Promise<PickImageFromDeviceWebResult> {
  return pickAppImage({ source: 'library', quality: 0.85 })
}
