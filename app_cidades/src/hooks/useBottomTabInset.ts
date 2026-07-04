import { useSafeAreaInsets } from 'react-native-safe-area-context'

const DEFAULT_MIN = 8

export function useBottomTabInset(): number {
  const insets = useSafeAreaInsets()
  return Math.max(insets.bottom, DEFAULT_MIN)
}
