export function env(key: string, fallback: string): string {
  const value = process.env[key]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback
}

export const appEnv = {
  logoUrl: env('EXPO_PUBLIC_LOGO_URL', 'assets/logo.png'),
  backgroundImageUrl: env('EXPO_PUBLIC_BACKGROUND_IMAGE_URL', 'assets/fundo_login.png'),
  municipalityName: env('EXPO_PUBLIC_MUNICIPALITY_NAME', 'São Paulo'),
  promoBannerUrls: env('EXPO_PUBLIC_PROMO_BANNERS', ''),
} as const
