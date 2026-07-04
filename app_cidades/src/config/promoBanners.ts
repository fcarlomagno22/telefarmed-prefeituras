import { ImageSourcePropType } from 'react-native'
import { appEnv } from './env'
import { resolveBrandImage } from '../utils/resolveBrandImage'

export type PromoBannerTargetRoute = 'run-walk' | 'eat-well' | 'mental-health'

export type PromoThemedImageBanner = {
  id: string
  kind: 'themed-image'
  source: ImageSourcePropType
  eyebrow: string
  title: string
  accentColor: string
  targetRoute: PromoBannerTargetRoute
  accessibilityLabel?: string
}

export type PromoChildBehaviorScreeningBanner = {
  id: string
  kind: 'child-behavior-screening'
  accessibilityLabel?: string
}

export type PromoBanner = PromoThemedImageBanner | PromoChildBehaviorScreeningBanner

const CHILD_BEHAVIOR_SCREENING_BANNER: PromoChildBehaviorScreeningBanner = {
  id: 'promo-child-behavior-screening',
  kind: 'child-behavior-screening',
  accessibilityLabel:
    'Como está o foco do seu filho? Questionário sobre atenção e comportamento infantil.',
}

const DEFAULT_THEMED_BANNERS: PromoThemedImageBanner[] = [
  {
    id: 'promo-run-walk',
    kind: 'themed-image',
    source: {
      uri: 'https://images.unsplash.com/photo-1476480862126-82fdce4c42a5?w=900&auto=format&fit=crop',
    },
    eyebrow: 'Corrida e caminhada',
    title: 'Mova-se no seu ritmo',
    accentColor: '#fb923c',
    targetRoute: 'run-walk',
    accessibilityLabel: 'Corrida e caminhada. Mova-se no seu ritmo.',
  },
  {
    id: 'promo-eat-well',
    kind: 'themed-image',
    source: {
      uri: 'https://images.unsplash.com/photo-1490645935967-ab0e596886ca?w=900&auto=format&fit=crop',
    },
    eyebrow: 'Comer bem',
    title: 'Nutrição no dia a dia',
    accentColor: '#4ade80',
    targetRoute: 'eat-well',
    accessibilityLabel: 'Comer bem. Nutrição no dia a dia.',
  },
  {
    id: 'promo-mental-health',
    kind: 'themed-image',
    source: {
      uri: 'https://images.unsplash.com/photo-1506126613408-807c5c283b98?w=900&auto=format&fit=crop',
    },
    eyebrow: 'Saúde mental',
    title: 'Equilíbrio emocional',
    accentColor: '#a78bfa',
    targetRoute: 'mental-health',
    accessibilityLabel: 'Saúde mental. Equilíbrio emocional.',
  },
]

const THEMED_BANNER_BY_INDEX: Pick<
  PromoThemedImageBanner,
  'eyebrow' | 'title' | 'accentColor' | 'targetRoute' | 'accessibilityLabel'
>[] = DEFAULT_THEMED_BANNERS.map((banner) => ({
  eyebrow: banner.eyebrow,
  title: banner.title,
  accentColor: banner.accentColor,
  targetRoute: banner.targetRoute,
  accessibilityLabel: banner.accessibilityLabel,
}))

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

function buildThemedBannerFromUrl(url: string, index: number): PromoThemedImageBanner {
  const theme = THEMED_BANNER_BY_INDEX[index] ?? THEMED_BANNER_BY_INDEX[0]

  return {
    id: `promo-themed-${index + 1}`,
    kind: 'themed-image',
    source: toBannerSource(url),
    ...theme,
  }
}

export function getPromoBanners(): PromoBanner[] {
  const urls = parsePromoBannerUrls(appEnv.promoBannerUrls)

  const themedBanners: PromoThemedImageBanner[] =
    urls.length === 0
      ? DEFAULT_THEMED_BANNERS
      : urls.map((url, index) => buildThemedBannerFromUrl(url, index))

  return [CHILD_BEHAVIOR_SCREENING_BANNER, ...themedBanners]
}
