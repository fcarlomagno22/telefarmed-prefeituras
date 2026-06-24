import type { AnimationObject } from 'lottie-react-native'

const SUDOKU_CELEBRATION_LOTTIES = [
  require('../../assets/cft1.json'),
  require('../../assets/cft2.json'),
  require('../../assets/cft3.json'),
  require('../../assets/cft4.json'),
  require('../../assets/cft5.json'),
  require('../../assets/cft6.json'),
] as const satisfies readonly AnimationObject[]

export function pickRandomSudokuCelebrationLottie(): AnimationObject {
  const index = Math.floor(Math.random() * SUDOKU_CELEBRATION_LOTTIES.length)
  return SUDOKU_CELEBRATION_LOTTIES[index]
}
