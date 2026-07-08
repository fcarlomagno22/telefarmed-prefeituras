import type { ImageSourcePropType } from 'react-native'
import type { AppColorScheme } from '../data/appColorSchemeStorage'
import { getRuntimeBranding } from '../config/runtimeBranding'

const localAssets = {
  'logo.png': require('../../assets/logo.png'),
  'fundo_login.png': require('../../assets/fundo_login.png'),
  'fundo_login_claro.png': require('../../assets/fundo_login_claro.png'),
} as const satisfies Record<string, ImageSourcePropType>

type LocalAssetKey = keyof typeof localAssets

const THEME_BACKGROUND_FALLBACK: Record<AppColorScheme, LocalAssetKey> = {
  light: 'fundo_login_claro.png',
  dark: 'fundo_login.png',
}

function isRemoteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

function toAssetKey(value: string): LocalAssetKey | null {
  const normalized = value.replace(/^\.?\/*/, '').replace(/^assets\//, '')
  const filename = normalized.split('/').pop()?.trim()

  if (!filename || !(filename in localAssets)) {
    return null
  }

  return filename as LocalAssetKey
}

export function resolveBrandImage(
  value: string,
  fallback: LocalAssetKey,
): ImageSourcePropType {
  if (isRemoteUrl(value)) {
    return { uri: value }
  }

  return localAssets[toAssetKey(value) ?? fallback]
}

export function resolveThemeBackgroundImage(
  scheme: AppColorScheme,
  configuredBackgroundUrl?: string,
): ImageSourcePropType {
  const fallback = THEME_BACKGROUND_FALLBACK[scheme]
  const configured =
    configuredBackgroundUrl?.trim() ||
    getRuntimeBranding().loginBackgroundUrl?.trim() ||
    ''

  if (!configured) {
    return localAssets[fallback]
  }

  if (isRemoteUrl(configured)) {
    return { uri: configured }
  }

  const key = toAssetKey(configured)
  if (!key) {
    return localAssets[fallback]
  }

  // Tema claro nunca usa o asset escuro legado (ex.: .env desatualizado no bundle).
  if (scheme === 'light' && key === 'fundo_login.png') {
    return localAssets[fallback]
  }
  if (scheme === 'dark' && key === 'fundo_login_claro.png') {
    return localAssets[fallback]
  }

  return localAssets[key]
}
