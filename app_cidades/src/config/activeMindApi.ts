import { env } from './env'

/** Quando `false`, Ativa Mente usa apenas cache local (sem chamadas à API VD). */
export function isActiveMindApiEnabled(): boolean {
  const raw = env('EXPO_PUBLIC_ACTIVE_MIND_API', 'true')
  return raw === 'true' || raw === '1'
}
