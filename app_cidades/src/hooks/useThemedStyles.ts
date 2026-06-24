import { useMemo } from 'react'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'
import { useTheme } from '../contexts/ThemeContext'
import type { ThemeColors } from '../theme/palettes'

type NamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>

export function useThemedStyles<T extends NamedStyles>(
  factory: (colors: ThemeColors) => T,
): T {
  const { colors } = useTheme()

  return useMemo(() => factory(colors), [colors, factory])
}
