import type { ImageSourcePropType } from 'react-native'

const localAssets = {
  'logo.png': require('../../assets/logo.png'),
  'fundo_login.png': require('../../assets/fundo_login.png'),
} as const satisfies Record<string, ImageSourcePropType>

type LocalAssetKey = keyof typeof localAssets

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
