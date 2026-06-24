import type { MentalHealthMoodLevelId } from '../types/mentalHealth'

const goodAnimation = require('../../assets/good.json')
const blushAnimation = require('../../assets/blush.json')
const neutraAnimation = require('../../assets/neutra.json')
const malAnimation = require('../../assets/mal.json')
const muitoMalAnimation = require('../../assets/muito_mal.json')

export const MENTAL_HEALTH_MOOD_LOTTIE: Partial<
  Record<MentalHealthMoodLevelId, typeof goodAnimation>
> = {
  'very-good': goodAnimation,
  good: blushAnimation,
  neutral: neutraAnimation,
  bad: malAnimation,
  'very-bad': muitoMalAnimation,
}

// Each JSON fills its canvas differently; scale normalizes visual size in the picker.
export const MENTAL_HEALTH_MOOD_LOTTIE_SCALE: Partial<Record<MentalHealthMoodLevelId, number>> = {
  'very-good': 1,
  good: 1.3,
  neutral: 0.85,
  bad: 0.86,
  'very-bad': 0.86,
}

// Inline snapshot (ex.: card em Cuidar) — tamanho visual ~30px em todos os humores.
export const MENTAL_HEALTH_MOOD_LOTTIE_SNAPSHOT_FRAME: Record<
  MentalHealthMoodLevelId,
  { frame: number; scale: number }
> = {
  'very-good': { frame: 40, scale: 0.75 },
  good: { frame: 40, scale: 0.78 },
  neutral: { frame: 34, scale: 0.88 },
  bad: { frame: 44, scale: 0.7 },
  'very-bad': { frame: 44, scale: 0.7 },
}

export function getMentalHealthMoodLottie(mood: MentalHealthMoodLevelId) {
  return MENTAL_HEALTH_MOOD_LOTTIE[mood] ?? null
}

export function getMentalHealthMoodLottieScale(mood: MentalHealthMoodLevelId) {
  return MENTAL_HEALTH_MOOD_LOTTIE_SCALE[mood] ?? 1
}

export function getMentalHealthMoodLottieSnapshotFrame(mood: MentalHealthMoodLevelId) {
  return MENTAL_HEALTH_MOOD_LOTTIE_SNAPSHOT_FRAME[mood]
}

export function hasMentalHealthMoodLottie(mood: MentalHealthMoodLevelId) {
  return getMentalHealthMoodLottie(mood) != null
}
