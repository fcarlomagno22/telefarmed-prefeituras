import { createContext, ReactNode, useContext, useMemo } from 'react'
import type { ImageSourcePropType } from 'react-native'
import type { AppColorScheme } from '../data/appColorSchemeStorage'
import { getThemeColors, type ThemeColors } from '../theme/palettes'
import { resolveThemeBackgroundImage } from '../utils/resolveBrandImage'

type ThemeContextValue = {
  colorScheme: AppColorScheme
  isDark: boolean
  isReady: boolean
  colors: ThemeColors
  backgroundSource: ImageSourcePropType
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const DEFAULT_COLOR_SCHEME: AppColorScheme = 'light'

const defaultBackgroundSource = resolveThemeBackgroundImage(DEFAULT_COLOR_SCHEME)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme: DEFAULT_COLOR_SCHEME,
      isDark: false,
      isReady: true,
      colors: getThemeColors(DEFAULT_COLOR_SCHEME),
      backgroundSource: resolveThemeBackgroundImage(DEFAULT_COLOR_SCHEME),
    }),
    [],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      colorScheme: DEFAULT_COLOR_SCHEME,
      isDark: false,
      isReady: true,
      colors: getThemeColors(DEFAULT_COLOR_SCHEME),
      backgroundSource: defaultBackgroundSource,
    }
  }
  return context
}
