/** Divide a palavra em letras individuais, preservando acentos (ex.: M, Ú, S). */
export function splitWordIntoScrambleChunks(word: string): string[] {
  if (!word) return []
  return Array.from(word)
}

export function shuffleChunks<T>(values: readonly T[]): T[] {
  const array = [...values]
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[array[index], array[swapIndex]] = [array[swapIndex], array[index]]
  }
  return array
}

export function normalizeWordAnswer(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function isFormTheWordAnswerCorrect(word: string, answerChunks: readonly string[]): boolean {
  return normalizeWordAnswer(word) === normalizeWordAnswer(answerChunks.join(''))
}
