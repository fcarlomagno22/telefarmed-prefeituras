import type { AppColorScheme } from '../data/appColorSchemeStorage'

export type ThemeColors = {
  background: string
  backgroundElevated: string
  surface: string
  surfaceBorder: string
  primary: string
  primaryLight: string
  primaryDark: string
  primaryGlow: string
  text: string
  textMuted: string
  textSubtle: string
  inputBg: string
  inputBorder: string
  inputBorderFocus: string
  error: string
  errorBg: string
  cardBg: string
  glassBorder: string
  screenOverlay: readonly [string, string, string]
}

export const darkPalette: ThemeColors = {
  background: '#0a0a0c',
  backgroundElevated: '#14141a',
  surface: 'rgba(255, 255, 255, 0.06)',
  surfaceBorder: 'rgba(255, 255, 255, 0.1)',
  primary: '#ff6b00',
  primaryLight: '#ff8533',
  primaryDark: '#e55f00',
  primaryGlow: 'rgba(255, 107, 0, 0.35)',
  text: '#f5f5f7',
  textMuted: 'rgba(245, 245, 247, 0.55)',
  textSubtle: 'rgba(245, 245, 247, 0.35)',
  inputBg: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(255, 255, 255, 0.12)',
  inputBorderFocus: 'rgba(255, 107, 0, 0.6)',
  error: '#ff6b6b',
  errorBg: 'rgba(255, 107, 107, 0.12)',
  cardBg: '#14141A80',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  screenOverlay: ['rgba(10, 10, 12, 0.55)', 'transparent', 'rgba(10, 10, 12, 0.75)'],
}

export const lightPalette: ThemeColors = {
  background: '#f5f5f7',
  backgroundElevated: '#ffffff',
  surface: 'rgba(0, 0, 0, 0.04)',
  surfaceBorder: 'rgba(0, 0, 0, 0.08)',
  primary: '#ff6b00',
  primaryLight: '#ff8533',
  primaryDark: '#e55f00',
  primaryGlow: 'rgba(255, 107, 0, 0.25)',
  text: '#1a1a1f',
  textMuted: 'rgba(26, 26, 31, 0.55)',
  textSubtle: 'rgba(26, 26, 31, 0.35)',
  inputBg: 'rgba(0, 0, 0, 0.04)',
  inputBorder: 'rgba(0, 0, 0, 0.1)',
  inputBorderFocus: 'rgba(255, 107, 0, 0.6)',
  error: '#e04545',
  errorBg: 'rgba(224, 69, 69, 0.12)',
  cardBg: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  screenOverlay: ['rgba(245, 245, 247, 0.55)', 'transparent', 'rgba(245, 245, 247, 0.75)'],
}

export function getThemeColors(scheme: AppColorScheme): ThemeColors {
  return scheme === 'light' ? lightPalette : darkPalette
}
