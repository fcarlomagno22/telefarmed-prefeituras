import type { SleepStoryContent } from '../types/sleepStories'

/** Faixa exibida para histórias típicas (~900–1200 palavras). */
const MIN_READING_MINUTES = 5
const MAX_READING_MINUTES = 7

/** Ritmo de leitura em voz alta antes de dormir — calibrado para a faixa de 5–7 min. */
const SLEEP_STORY_WORDS_PER_MINUTE = 170

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function estimateSleepStoryReadingMinutes(content: SleepStoryContent) {
  const fullText = [
    ...content.paragraphs.map((paragraph) => paragraph.text),
    content.lesson?.text ?? '',
  ].join(' ')

  const words = countWords(fullText)
  const minutes = Math.round(words / SLEEP_STORY_WORDS_PER_MINUTE)

  return Math.min(MAX_READING_MINUTES, Math.max(MIN_READING_MINUTES, minutes))
}
