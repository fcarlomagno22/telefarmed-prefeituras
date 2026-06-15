import { ImageSourcePropType } from 'react-native'
import { appEnv } from './env'
import { resolveBrandImage } from '../utils/resolveBrandImage'

export type PromoBanner = {
  id: string
  source: ImageSourcePropType
  accessibilityLabel?: string
}

const DEMO_BANNER_URLS = [
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50e?w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&auto=format&fit=crop',
] as const

function parsePromoBannerUrls(raw: string): string[] {
  const trimmed = raw.trim()
  if (!trimmed) return []

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      }
    } catch {
      return []
    }
  }

  return trimmed
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function toBannerSource(url: string): ImageSourcePropType {
  if (/^https?:\/\//i.test(url)) {
    return { uri: url }
  }

  return resolveBrandImage(url, 'fundo_login.png')
}

function buildDefaultBanners(): PromoBanner[] {
  return DEMO_BANNER_URLS.map((url, index) => ({
    id: `promo-demo-${index + 1}`,
    source: { uri: url },
    accessibilityLabel: `Banner promocional ${index + 1}`,
  }))
}

export function getPromoBanners(): PromoBanner[] {
  const urls = parsePromoBannerUrls(appEnv.promoBannerUrls)

  if (urls.length === 0) {
    return buildDefaultBanners()
  }

  return urls.map((url, index) => ({
    id: `promo-${index + 1}`,
    source: toBannerSource(url),
    accessibilityLabel: `Banner promocional ${index + 1}`,
  }))
}
