import { createContext, ReactNode, useContext, useEffect, useMemo } from 'react'
import type { ImageSourcePropType } from 'react-native'
import type { AppColorScheme } from '../data/appColorSchemeStorage'
import { useTenant } from './TenantContext'
import { buildThemeColorsFromPrimary } from '../theme/buildPaletteFromPrimary'
import { getThemeColors, type ThemeColors } from '../theme/palettes'
import { applyWebChromeColor } from '../adapters/webChromeTheme'
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
  const { branding, status } = useTenant()
  const isReady = status !== 'loading'

  const colors = useMemo(
    () => buildThemeColorsFromPrimary(branding.corPrimaria, DEFAULT_COLOR_SCHEME),
    [branding.corPrimaria],
  )

  const backgroundSource = useMemo(
    () =>
      resolveThemeBackgroundImage(
        DEFAULT_COLOR_SCHEME,
        branding.loginBackgroundUrl || undefined,
      ),
    [branding.loginBackgroundUrl],
  )

  useEffect(() => {
    applyWebChromeColor(colors.background, colors.background, {
      colorScheme: DEFAULT_COLOR_SCHEME,
    })
  }, [colors.background])

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme: DEFAULT_COLOR_SCHEME,
      isDark: false,
      isReady,
      colors,
      backgroundSource,
    }),
    [backgroundSource, colors, isReady],
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
