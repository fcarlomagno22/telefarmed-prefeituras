import type { MentalHealthMoodLevelId } from '../types/mentalHealth'

const muitoBemAnimation = require('../../assets/muito_bem.json')
const bemAnimation = require('../../assets/bem.json')
const neutraAnimation = require('../../assets/neutra.json')
const malAnimation = require('../../assets/mal.json')
const muitoMalAnimation = require('../../assets/muito_mal.json')

export const MENTAL_HEALTH_MOOD_LOTTIE: Partial<
  Record<MentalHealthMoodLevelId, typeof muitoBemAnimation>
> = {
  'very-good': muitoBemAnimation,
  good: bemAnimation,
  neutral: neutraAnimation,
  bad: malAnimation,
  'very-bad': muitoMalAnimation,
}

/** Slot quadrado reservado para o ícone (size="large" no check-in). */
export const MENTAL_HEALTH_MOOD_LOTTIE_SLOT_PX = 96

export function getMentalHealthMoodLottie(mood: MentalHealthMoodLevelId) {
  return MENTAL_HEALTH_MOOD_LOTTIE[mood] ?? null
}

/** Mesmo tamanho para todos — os JSONs compartilham canvas 1500×1500 e escala SIZE 650%. */
export function getMentalHealthMoodLottieRenderPx(slotPx: number = MENTAL_HEALTH_MOOD_LOTTIE_SLOT_PX) {
  return slotPx
}

export function hasMentalHealthMoodLottie(mood: MentalHealthMoodLevelId) {
  return getMentalHealthMoodLottie(mood) != null
}
