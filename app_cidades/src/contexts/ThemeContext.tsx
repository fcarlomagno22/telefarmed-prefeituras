import { createContext, ReactNode, useContext, useMemo } from 'react'
import type { ImageSourcePropType } from 'react-native'
import { appEnv } from '../config/env'
import type { AppColorScheme } from '../data/appColorSchemeStorage'
import { getThemeColors, type ThemeColors } from '../theme/palettes'
import { resolveBrandImage } from '../utils/resolveBrandImage'

type ThemeContextValue = {
  colorScheme: AppColorScheme
  isDark: boolean
  isReady: boolean
  colors: ThemeColors
  backgroundSource: ImageSourcePropType
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme: 'dark',
      isDark: true,
      isReady: true,
      colors: getThemeColors('dark'),
      backgroundSource,
    }),
    [],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      colorScheme: 'dark',
      isDark: true,
      isReady: true,
      colors: getThemeColors('dark'),
      backgroundSource,
    }
  }
  return context
}
