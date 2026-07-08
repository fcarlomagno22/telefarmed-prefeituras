import type { AppColorScheme } from '../data/appColorSchemeStorage'
import { normalizePrimaryColor, hexToRgba, shadeHex } from '../utils/brandColor'
import { darkPalette, lightPalette, type ThemeColors } from './palettes'

export function buildThemeColorsFromPrimary(
  primaryInput: string | null | undefined,
  scheme: AppColorScheme,
): ThemeColors {
  const primary = normalizePrimaryColor(primaryInput)
  const base = scheme === 'light' ? lightPalette : darkPalette

  return {
    ...base,
    primary,
    primaryLight: shadeHex(primary, 30),
    primaryDark: shadeHex(primary, -20),
    primaryGlow: hexToRgba(primary, scheme === 'light' ? 0.25 : 0.35),
    inputBorderFocus: hexToRgba(primary, 0.6),
  }
}
