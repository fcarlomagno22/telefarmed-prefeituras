import { Platform } from 'react-native'

/** Altura típica da nav bar de 3 botões quando insets.bottom vem 0 (ex.: Modal nativo). */
export const ANDROID_NAV_BAR_FALLBACK = 48

export function getAndroidBottomInset(insetsBottom: number): number {
  if (Platform.OS !== 'android') {
    return insetsBottom
  }

  return Math.max(insetsBottom, ANDROID_NAV_BAR_FALLBACK)
}
