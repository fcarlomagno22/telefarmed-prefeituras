import { resolveLiveShareWebBaseUrl } from './liveShareWebBaseUrl'

export function env(key: string, fallback: string): string {
  const value = process.env[key]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback
}

/** Config estática não derivada do tenant (Supabase, OpenAI, etc.). Branding vem do TenantContext. */
export const appEnv = {
  promoBannerUrls: env('EXPO_PUBLIC_PROMO_BANNERS', ''),
  supabaseUrl: env('EXPO_PUBLIC_SUPABASE_URL', ''),
  supabaseAnonKey: env('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),
  get liveShareWebBaseUrl() {
    return resolveLiveShareWebBaseUrl()
  },
} as const
