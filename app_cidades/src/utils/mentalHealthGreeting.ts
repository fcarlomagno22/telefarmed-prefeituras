import type { MentalHealthWelcomeState } from '../types/mentalHealth'

export function resolveMentalHealthWelcomeState(input: {
  checkInCompleted: boolean
  hasSufficientHistory: boolean
}): MentalHealthWelcomeState {
  if (input.checkInCompleted) return 'checkin-done'
  if (input.hasSufficientHistory) return 'has-history'
  return 'no-history'
}
