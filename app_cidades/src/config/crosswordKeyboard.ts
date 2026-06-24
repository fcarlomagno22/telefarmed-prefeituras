export type CrosswordKeyboardRow = {
  keys: readonly string[]
  /** Meio-botão de recuo visual, como em teclados QWERTY. */
  indentFlex?: number
}

/** Layout QWERTY (padrão brasileiro). */
export const CROSSWORD_KEYBOARD_ROWS: readonly CrosswordKeyboardRow[] = [
  { keys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'] },
  { keys: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], indentFlex: 0.55 },
  { keys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M'], indentFlex: 1.1 },
]

/** Variantes exibidas ao segurar a tecla base. */
export const CROSSWORD_LETTER_VARIANTS: Record<string, readonly string[]> = {
  A: ['Á', 'Â', 'Ã', 'À'],
  C: ['Ç'],
  E: ['É', 'Ê'],
  I: ['Í'],
  O: ['Ó', 'Ô', 'Õ'],
  U: ['Ú'],
}

export function getCrosswordLetterVariants(letter: string): readonly string[] {
  return CROSSWORD_LETTER_VARIANTS[letter.toUpperCase()] ?? []
}

export function hasCrosswordLetterVariants(letter: string): boolean {
  return getCrosswordLetterVariants(letter).length > 0
}
