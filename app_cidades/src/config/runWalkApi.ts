import { env } from './env'

/** Quando `false`, run-walk usa apenas cache local (sem chamadas à API VD). */
export function isRunWalkApiEnabled(): boolean {
  const raw = env('EXPO_PUBLIC_RUN_WALK_API', 'true')
  return raw === 'true' || raw === '1'
}
