import type { MentalHealthOnboardingPreferences } from '../types/mentalHealth'

export function hasChristianSpiritualContent(
  preferences: MentalHealthOnboardingPreferences,
) {
  return preferences.spiritualityPreference === 'christian'
}
