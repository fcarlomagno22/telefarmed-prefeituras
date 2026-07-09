import { env } from './env'

/** Quando `false`, treino funcional usa apenas cache local (sem chamadas à API VD). */
export function isFunctionalTrainingApiEnabled(): boolean {
  const raw = env('EXPO_PUBLIC_FUNCTIONAL_TRAINING_API', 'true')
  return raw === 'true' || raw === '1'
}
