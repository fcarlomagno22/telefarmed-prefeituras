import { env } from './env'

export const DEFAULT_PRIMARY_COLOR = '#ff6b00'

/** Fallback local quando tenant ainda não carregou ou slug não está disponível (dev). */
export const fallbackBranding = {
  logoUrl: env('EXPO_PUBLIC_LOGO_URL', 'assets/logo.png'),
  loginBackgroundUrl: env('EXPO_PUBLIC_BACKGROUND_IMAGE_URL', ''),
  faviconUrl: null as string | null,
  corPrimaria: DEFAULT_PRIMARY_COLOR,
  municipalityName: env('EXPO_PUBLIC_MUNICIPALITY_NAME', 'São Paulo'),
} as const
