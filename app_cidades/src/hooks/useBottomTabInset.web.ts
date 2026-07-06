import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isAndroidWeb } from '../adapters/webChromeTheme.web'

const DEFAULT_MIN = 8
const ANDROID_PWA_MIN = 12

export function useBottomTabInset(): number {
  const insets = useSafeAreaInsets()
  const bottom = insets.bottom

  if (isAndroidWeb()) {
    return Math.max(bottom, ANDROID_PWA_MIN)
  }

  return Math.max(bottom, DEFAULT_MIN)
}
