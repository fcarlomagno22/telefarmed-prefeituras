import { env } from './env'

/** Quando `false`, Hora de Dormir usa apenas cache local (sem chamadas à API VD). */
export function isSleepTimeApiEnabled(): boolean {
  const raw = env('EXPO_PUBLIC_SLEEP_TIME_API', 'true')
  return raw === 'true' || raw === '1'
}
